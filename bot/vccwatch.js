// VCC restock watcher — monitor stok supplier Senna,
// kirim pengumuman otomatis ke channel & broadcast ke user bot saat stok kembali tersedia.
const store = require('./db');
const senna = require('./senna');
const { notify } = require('./notify');

const POLL_MS = 60 * 1000; // poling supplier tiap 1 menit

const rp = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// status terakhir stok per product_id (-1 = belum pernah dicek / baseline)
const lastStock = new Map();

function channelEnabled() { return store.getSetting('vcc_restock_channel', '1') !== '0'; }
function usersEnabled() { return store.getSetting('vcc_restock_users', '0') === '1'; }

async function vccProducts() {
  return store.db.prepare("SELECT * FROM products WHERE type='vcc' AND is_active=1 AND senna_product_id != ''").all();
}

async function currentStocks() {
  if (!senna.enabled()) return null;
  const cat = await senna.catalog().catch(() => null);
  if (!cat) return null;
  const out = [];
  for (const p of await vccProducts()) {
    const sp = cat.find((s) => s.id === p.senna_product_id);
    out.push({ p, stock: sp ? Number(sp.stock || 0) : null });
  }
  return out;
}

function restockText(p, stock) {
  const shop = store.getSetting('shop_name', 'La Cukai Shop') || 'La Cukai Shop';
  return [
    '💳 <b>VCC RESTOCK!</b>',
    '',
    `✅ <b>${esc(p.name)}</b> sekarang tersedia`,
    `📦 Stok tersedia: <b>${stock}</b>`,
    `💰 Harga: <b>${rp(p.price)}</b>`,
    '',
    `<i>Beli lewat bot ya, sebelum habis — ${esc(shop)}</i>`,
  ].join('\n');
}

async function announce(bot, p, stock) {
  const contact = (store.getSetting('admin_contact', '@lacukbot') || '@lacukbot').trim();
  const shopLink = contact.startsWith('http') ? contact : 'https://t.me/' + contact.replace(/^@/, '');
  const html = restockText(p, stock);
  const kb = { inline_keyboard: [[{ text: '🛒 Beli Sekarang', url: shopLink }]] };

  if (channelEnabled()) {
    await notify(html, p.photo_url || undefined);
  }

  if (usersEnabled()) {
    const users = store.db.prepare('SELECT id FROM users').all().map((u) => u.id);
    let ok = 0;
    for (const uid of users) {
      try {
        await bot.telegram.sendMessage(uid, html, { parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: kb });
        ok++;
      } catch (e) { /* user blokir bot / chat not found → skip */ }
      await sleep(250); // hindari flood Telegram
    }
    console.log(`[vccwatch] broadcast user ${p.name}: ${ok}/${users.length} terkirim`);
  }
}

async function checkOnce(bot) {
  const stocks = await currentStocks();
  if (!stocks) return;
  for (const { p, stock } of stocks) {
    const prev = lastStock.has(p.id) ? lastStock.get(p.id) : null;
    lastStock.set(p.id, stock);
    if (prev === null) continue; // baseline pertama kali → tanpa pengumuman

    const wasOut = prev == null || prev <= 0;
    const isReady = stock != null && stock > 0;
    if (wasOut && isReady) {
      console.log(`[vccwatch] RESTOCK: ${p.name} 0 → ${stock}`);
      await announce(bot, p, stock);
    }
  }
}

function start(bot) {
  if (!senna.enabled()) { console.log('[vccwatch] skip — Senna API belum dikonfigurasi'); return; }
  const loop = async () => {
    try { await checkOnce(bot); } catch (e) { console.log('[vccwatch] error:', e.message); }
    finally { setTimeout(loop, POLL_MS); }
  };
  console.log('[vccwatch] mulai monitor stok VCC (tiap 60s)');
  setTimeout(loop, 20 * 1000);
}

async function stocks(bot) {
  const list = await currentStocks();
  const chan = channelEnabled();
  const brd = usersEnabled();
  const chTarget = (store.getSetting('notify_channel_id', '') || store.getSetting('channel_url', '') || 'belum diatur').trim();
  const lines = (list || []).map(({ p, stock }) => {
    const s = stock == null ? '⏳ menunggu supplier' : (stock > 0 ? `✅ ${stock} tersedia` : '❌ kosong');
    return `  ${esc(p.name)} — ${s}`;
  });
  return [
    '💳 <b>VCC STOCK WATCH</b>',
    '',
    `📢 Info ke channel: ${chan ? '✅ AKTIF' : '❌ MATI'} <i>(target: ${esc(chTarget)})</i>`,
    `👥 Broadcast ke user bot: ${brd ? '✅ AKTIF' : '❌ MATI'}`,
    '',
    'Status stok sekarang:',
    ...(lines.length ? lines : ['  (tidak ada produk VCC aktif)']),
  ].join('\n');
}

module.exports = { start, stocks, checkOnce, channelEnabled, usersEnabled };
