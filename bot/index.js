require('dotenv').config();
const { setupBot } = require('./bot');
const { startWeb } = require('./web');
const store = require('./db');
const senna = require('./senna');
const rp = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');

const bot = setupBot();
global._bot = bot;

// watcher VCC restock → auto info ke channel / broadcast user
require('./vccwatch').start(bot);

// cek saldo deposit VCC (Senna) tiap 30 menit, alert admin saat di bawah ambang
let sennaLowAlerted = null;
async function sennaLowCheck() {
  if (!senna.enabled()) return;
  const threshold = Number(store.getSetting('senna_low_balance', '3000')) || 3000;
  let dep = null;
  try { dep = Number(await senna.balance()); } catch (e) { return; }
  const low = dep < threshold;
  if (low && sennaLowAlerted !== low) {
    const ids = (process.env.ADMIN_IDS || '').split(',').map(Number).filter(Boolean);
    const msg = `⚠️ <b>Saldo VCC rendah</b>\n\n💰 Deposit: <b>${rp(dep)}</b>\n🧮 Ambang: ${rp(threshold)}\n\nSegera isi deposit di @vccsenna_bot — selama deposit kosong, pembelian VCC diblokir.`;
    for (const id of ids) bot.telegram.sendMessage(id, msg, { parse_mode: 'HTML' }).catch(() => {});
  }
  sennaLowAlerted = low;
}
setTimeout(sennaLowCheck, 15000);
setInterval(sennaLowCheck, 30 * 60 * 1000);

(async () => {
  // hapus webhook lama (pakai long polling) biar tidak konflik
  try { await bot.telegram.deleteWebhook({ drop_pending_updates: false }); } catch (e) {}
  startWeb();
  await bot.launch();
  console.log('[bot] La Cukai Shop running (long polling)');
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
