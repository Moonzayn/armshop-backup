const store = require('./db');

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function rp(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID');
}

// target channel: id numerik (notify_channel_id) atau channel_url (@username / t.me)
function target() {
  const nid = (store.getSetting('notify_channel_id', '') || '').trim();
  if (/^-?\d+$/.test(nid)) return nid;
  const raw = (store.getSetting('channel_url', '') || '').trim();
  if (!raw) return null;
  if (/^-?\d+$/.test(raw)) return raw;
  const m = raw.match(/(?:https?:\/\/)?t\.me\/([A-Za-z0-9_]+)/i) || raw.match(/^@([A-Za-z0-9_]+)$/);
  return m ? '@' + m[1] : null;
}

function catName(id) {
  if (!id) return '-';
  const c = store.categories().find((x) => x.id === id);
  return c ? c.name : id;
}

async function notify(html, photo) {
  try {
    const chat = target();
    const bot = global._bot;
    if (!chat || !bot) return null;
    if (photo) {
      try {
        const m = await bot.telegram.sendPhoto(chat, photo, { caption: html, parse_mode: 'HTML' });
        console.log('[notify] terkirim (foto) ke', chat, 'msg', m && m.message_id);
        return (m && m.message_id) || null;
      } catch (e) { /* fallback ke teks */ }
    }
    const m = await bot.telegram.sendMessage(chat, html, { parse_mode: 'HTML', disable_web_page_preview: false });
    console.log('[notify] terkirim ke', chat, 'msg', m && m.message_id);
    return (m && m.message_id) || null;
  } catch (e) {
    console.log('[notify] gagal kirim ke channel:', e.message);
    return null;
  }
}

// broadcast pesan ke semua user bot (yang blokir bot dilewati)
async function broadcastUsers(html, kb) {
  try {
    const bot = global._bot;
    if (!bot) return 0;
    const users = store.db.prepare('SELECT id FROM users').all().map((u) => u.id);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let ok = 0;
    for (const uid of users) {
      try {
        await bot.telegram.sendMessage(uid, html, { parse_mode: 'HTML', disable_web_page_preview: true, ...(kb ? { reply_markup: kb } : {}) });
        ok++;
      } catch (e) { /* blokir bot / chat not found → skip */ }
      await sleep(250); // hindari flood Telegram
    }
    console.log(`[bc-users] broadcast: ${ok}/${users.length} terkirim`);
    return ok;
  } catch (e) {
    console.log('[bc-users] gagal:', e.message);
    return 0;
  }
}

function announceProduct(p) {
  if (!p) return Promise.resolve(null);
  const stock = store.db.prepare('SELECT COUNT(*) n FROM stock WHERE product_id=?').get(p.id).n;
  const contact = (store.getSetting('admin_contact', '@lacukbot') || '@lacukbot').trim();
  const shopLink = contact.startsWith('http') ? contact : 'https://t.me/' + contact.replace(/^@/, '');
  const kb = { inline_keyboard: [[{ text: '🛒 Beli Sekarang', url: shopLink }]] };
  const lines = [
    '🛍️ <b>PRODUK BARU!</b>',
    '',
    `<b>${esc(p.name)}</b>`,
    `💰 Harga: <b>${rp(p.price)}</b>`,
    `📂 Kategori: ${esc(catName(p.category_id))}`,
  ];
  if (p.type !== 'manual') lines.push(`📦 Stok: ${stock} kode`);
  if (p.description) lines.push('', `<i>${esc(String(p.description).slice(0, 300))}</i>`);
  const html = lines.join('\n');
  return notify(html, p.photo_url || undefined).then((r) => {
    if (store.getSetting('product_notify_users', '1') === '1') {
      return broadcastUsers(html, kb);
    }
    return r;
  });
}

function announceRestock(p, added, total) {
  if (!p) return Promise.resolve(null);
  const html = [
    '📦 <b>STOK BARU MASUK</b>',
    '',
    `<b>${esc(p.name)}</b>`,
    `➕ ${added} kode ditambahkan`,
    `🔢 Total stok sekarang: <b>${total}</b>`,
  ].join('\n');
  return notify(html).then((r) => {
    if (store.getSetting('restock_notify_users', '0') === '1') {
      return broadcastUsers(html);
    }
    return r;
  });
}

function announceImport(added, skipped, names) {
  if (!added) return Promise.resolve(null);
  const shown = names.slice(0, 6).map((n) => `• ${esc(n)}`).join('\n');
  const more = names.length > 6 ? `\n<i>…dan ${names.length - 6} lainnya</i>` : '';
  return notify([
    '🗂️ <b>PRODUK BARU (IMPOR)</b>',
    '',
    `${added} produk berhasil ditambahkan${skipped ? ` (${skipped} baris dilewati)` : ''}.`,
    shown ? shown + more : '',
  ].join('\n'));
}

// maskir nama pembeli: hanya 3 huruf pertama
function maskName(name) {
  const s = String(name || '').trim();
  if (!s) return 'Pelanggan';
  let head = '';
  for (const ch of s) { if (head.length < 3) head += ch; else break; }
  return head + '***';
}

const notifiedInv = new Set();
function announceInvoice(inv) {
  if (!inv || !inv.orderId || notifiedInv.has(inv.orderId)) return Promise.resolve(null);
  notifiedInv.add(inv.orderId);
  if (notifiedInv.size > 500) notifiedInv.delete(notifiedInv.values().next().value);
  const itemsLine = (inv.items || []).map((it) => `  • ${esc(it.name)}${Number(it.qty) > 1 ? ` ×${it.qty}` : ''}`).join('\n') || '  • -';
  const waktu = (() => {
    try {
      return new Date(inv.paidAt || Date.now()).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }) + ' WIB';
    } catch (e) { return '-'; }
  })();
  const shop = store.getSetting('shop_name', 'La Cukai Shop') || 'La Cukai Shop';
  const contact = (store.getSetting('admin_contact', '@lacukbot') || '@lacukbot').trim();
  const shopLink = contact.startsWith('http') ? contact : 'https://t.me/' + contact.replace(/^@/, '');
  const divide = '─'.repeat(19);
  return notify([
    '🧾 <b>BUKTI PEMBAYARAN BERHASIL</b>',
    '',
    '✅ <b>TRANSAKSI SUKSES</b>',
    '',
    `🧾 No. Order ─ <code>${esc(inv.orderId)}</code>`,
    `👤 Pembeli ─ <b>${esc(maskName(inv.buyer))}</b>`,
    '📦 Produk ─',
    itemsLine,
    '💳 Metode ─ QRIS',
    `💰 Nominal ─ <b>${rp(inv.total)}</b>`,
    `⏰ Waktu ─ ${waktu}`,
    '',
    divide,
    `💎 Terima kasih telah berbelanja di <b>${esc(shop)}</b>!`,
    `🛍️ Belanja instan juga di <a href="${shopLink}">${esc(shop)}</a> ${'→'}`,
    divide,
  ].join('\n'));
}

module.exports = { notify, target, announceProduct, announceRestock, announceImport, announceInvoice, maskName };
