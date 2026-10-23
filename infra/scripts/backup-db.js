// Backup online shop.sqlite (aman saat bot berjalan, mode WAL) -> ~/backups/db/
const fs = require('fs');
const path = require('path');
const Database = require('/home/ubuntu/lacukai-bot/node_modules/better-sqlite3');

const dir = '/home/ubuntu/backups/db';
fs.mkdirSync(dir, { recursive: true });
const iso = new Date().toISOString(); // UTC
const ts = iso.slice(0, 10).replace(/-/g, '') + '-' + iso.slice(11, 16).replace(':', '');
const dest = path.join(dir, 'shop-' + ts + '.sqlite');

(async () => {
  const db = new Database('/home/ubuntu/lacukai-bot/shop.sqlite');
  await db.backup(dest);
  db.close();
  console.log('DB backup:', dest);
})().catch(e => { console.error('[backup-db]', e.message); process.exit(1); });
