const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'shop.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL,
  type TEXT DEFAULT 'digital',
  photo_url TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  sort INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_used INTEGER DEFAULT 0,
  used_by_order TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  product_id TEXT,
  product_name TEXT,
  qty INTEGER DEFAULT 1,
  amount INTEGER,
  discount INTEGER DEFAULT 0,
  total INTEGER,
  voucher_code TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  qris_image TEXT DEFAULT '',
  qris_url TEXT DEFAULT '',
  expired_at TEXT,
  delivered_content TEXT DEFAULT '',
  rating INTEGER DEFAULT 0,
  signature TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  paid_at TEXT
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  qty INTEGER DEFAULT 1,
  price INTEGER
);
CREATE TABLE IF NOT EXISTS vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  kind TEXT DEFAULT 'percent',
  value INTEGER NOT NULL,
  min_amount INTEGER DEFAULT 0,
  quota INTEGER DEFAULT 0,
  used INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ticket_msgs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  from_admin INTEGER DEFAULT 0,
  text TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS saldo (
  user_id INTEGER PRIMARY KEY,
  amount INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS saldo_tx (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  delta INTEGER NOT NULL,
  ref TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS topups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topup_id TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  qris_image TEXT DEFAULT '',
  qris_url TEXT DEFAULT '',
  expired_at TEXT,
  signature TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  paid_at TEXT
);
`);

const getSetting = (k, d = '') => {
  const r = db.prepare('SELECT value FROM settings WHERE key=?').get(k);
  return r ? r.value : d;
};
const setSetting = (k, v) => {
  db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v));
};
// defaults
[['shop_name', 'La Cukai Shop'], ['shop_tagline', 'Akun premium & topup game instan. Bayar QRIS, produk langsung dikirim.'],
 ['admin_contact', '@lacukbot'], ['invoice_expire_minutes', '60'], ['low_stock_threshold', '3'],
 ['channel_url', 'https://t.me/lacukai_official']
].forEach(([k, v]) => { if (!db.prepare('SELECT 1 FROM settings WHERE key=?').get(k)) setSetting(k, v); });

// lightweight migrations for existing DBs
for (const sql of [
  'ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1',
  'ALTER TABLE orders ADD COLUMN signature TEXT DEFAULT \'\'',
  'ALTER TABLE orders ADD COLUMN review TEXT DEFAULT \'\'',
  'ALTER TABLE users ADD COLUMN tnc_ok INTEGER DEFAULT 0',
  'ALTER TABLE products ADD COLUMN senna_product_id TEXT DEFAULT \'\'',
  'ALTER TABLE order_items ADD COLUMN custom_purpose TEXT DEFAULT \'\'',
  'ALTER TABLE orders ADD COLUMN senna_state TEXT DEFAULT \'\'',
  'ALTER TABLE orders ADD COLUMN qris_chat TEXT DEFAULT \'\'',
  'ALTER TABLE orders ADD COLUMN qris_msgid INTEGER DEFAULT 0',
  'ALTER TABLE topups ADD COLUMN qris_chat TEXT DEFAULT \'\'',
  'ALTER TABLE topups ADD COLUMN qris_msgid INTEGER DEFAULT 0',
  'ALTER TABLE products ADD COLUMN tos_text TEXT',
]) { try { db.exec(sql); } catch (e) {} }

db.exec(`
CREATE TABLE IF NOT EXISTS product_agreements (
  user_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  agreed_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id)
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS otp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  user_id INTEGER,
  last4 TEXT,
  code TEXT,
  message TEXT,
  matched INTEGER DEFAULT 0,
  received_at TEXT DEFAULT (datetime('now'))
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  link TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  sort INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

if (!getSetting('tnc_text')) setSetting('tnc_text', `1. Pesanan otomatis berlaku setelah pembayaran QRIS terkonfirmasi.
2. Produk digital dikirim otomatis berupa kode akun; produk layanan diproses manual oleh tim maksimal 2x24 jam.
3. Garansi berlaku sesuai ketentuan masing-masing produk. Akun kedaluwarsa/diblok di bawah garansi wajib lapor maks 24 jam sejak diterima untuk penggantian.
4. Dana yang sudah masuk tidak dapat dikembalikan, kecuali kesalahan sepenuhnya dari pihak toko.
5. Produk hanya untuk pemakaian pribadi pembeli. Dilarang menjual ulang atau mendistribusikan tanpa izin.
6. Data pembeli hanya digunakan untuk pengiriman produk dan pembukuan pesanan.
7. Bantuan & pertanyaan melalui menu Bantuan, dibalas jam kerja admin.`);
if (!getSetting('welcome_text')) setSetting('welcome_text', 'Selamat datang di <b>{shop}</b> 💎\n{tagline}');
if (!getSetting('help_text')) setSetting('help_text', 'Ketik pesan kamu di bawah, admin akan membalas secepatnya.\n<i>Ketik /batal untuk keluar.</i>');
const partnersAll = (activeOnly = false) => db.prepare(`SELECT * FROM partners ${activeOnly ? 'WHERE is_active=1' : ''} ORDER BY sort, name`).all();
const DEFAULT_TEXTS = {
  tnc_text: getSetting('tnc_text', ''),
  welcome_text: getSetting('welcome_text', ''),
  help_text: getSetting('help_text', ''),
};
function resetTexts() {
  db.prepare("DELETE FROM settings WHERE key IN ('tnc_text','welcome_text','help_text')").run();
  for (const [k, v] of Object.entries(DEFAULT_TEXTS)) setSetting(k, v);
}

module.exports = {
  db, getSetting, setSetting,

  upsertUser: (id, username, first_name) => {
    db.prepare(`INSERT INTO users(id,username,first_name) VALUES(?,?,?)
      ON CONFLICT(id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name`).run(id, username || '', first_name || '');
  },
  isAdmin: (id) => !!db.prepare('SELECT 1 FROM users WHERE id=? AND is_admin=1').get(id),

  // ---- catalog ----
  categories: (activeOnly = false) => db.prepare(`SELECT * FROM categories ${activeOnly ? 'WHERE is_active=1' : ''} ORDER BY sort, name`).all(),
  setCategoryActive: (id, active) => db.prepare('UPDATE categories SET is_active=? WHERE id=?').run(active ? 1 : 0, id),

  // ---- partners ----
  partners: partnersAll,
  setPartnerActive: (id, active) => db.prepare('UPDATE partners SET is_active=? WHERE id=?').run(active ? 1 : 0, id),

  // ---- tnc ----
  tncAccept: (uid) => db.prepare('UPDATE users SET tnc_ok=1 WHERE id=?').run(uid),
  tncOk: (uid) => !!(db.prepare('SELECT tnc_ok FROM users WHERE id=?').get(uid) || {}).tnc_ok,

  // ---- wallet / saldo ----
  walletGet: (uid) => (db.prepare('SELECT amount FROM saldo WHERE user_id=?').get(uid) || { amount: 0 }).amount,
  walletTx: (uid, kind, delta, ref = '', note = '') => {
    const t = db.transaction(() => {
      const cur = (db.prepare('SELECT amount FROM saldo WHERE user_id=?').get(uid) || { amount: 0 }).amount;
      const next = Number(cur) + Number(delta);
      if (next < 0) throw new Error('SALDO_KURANG');
      db.prepare('INSERT INTO saldo(user_id,amount) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET amount=excluded.amount').run(uid, next);
      db.prepare('INSERT INTO saldo_tx(user_id,kind,delta,ref,note) VALUES(?,?,?,?,?)').run(uid, kind, Number(delta), ref, note);
    });
    t();
    return db.prepare('SELECT amount FROM saldo WHERE user_id=?').get(uid).amount;
  },
  walletHistory: (uid, limit = 10) => db.prepare('SELECT * FROM saldo_tx WHERE user_id=? ORDER BY id DESC LIMIT ?').all(uid, limit),
  walletHasRef: (ref) => !!db.prepare('SELECT 1 FROM saldo_tx WHERE ref=?').get(ref),
  walletAll: () => db.prepare('SELECT s.user_id, s.amount, u.first_name, u.username FROM saldo s LEFT JOIN users u ON u.id=s.user_id ORDER BY s.amount DESC').all(),
  walletPendingTopups: () => db.prepare("SELECT * FROM topups WHERE status='pending'").all(),
  walletCreateTopup: (t) => db.prepare(`INSERT INTO topups(topup_id,user_id,amount,qris_image,qris_url,expired_at,signature)
      VALUES(@topup_id,@user_id,@amount,@qris_image,@qris_url,@expired_at,@signature)`).run(t),
  walletGetTopup: (id) => db.prepare('SELECT * FROM topups WHERE topup_id=?').get(id),
  walletSetTopupStatus: (id, status) => {
    const t = db.prepare('SELECT * FROM topups WHERE topup_id=?').get(id);
    if (!t || t.status !== 'pending') return false;
    db.prepare('UPDATE topups SET status=?, paid_at=? WHERE topup_id=?').run(status, status === 'paid' ? new Date().toISOString() : null, id);
    return t.status !== 'paid';
  },
  walletCreditTopup: (topupId) => db.transaction(() => {
    const t = db.prepare('SELECT * FROM topups WHERE topup_id=?').get(topupId);
    if (!t || t.status !== 'pending') return false;
    db.prepare('UPDATE topups SET status=?, paid_at=? WHERE topup_id=?').run('paid', new Date().toISOString(), topupId);
    db.prepare('INSERT INTO saldo_tx(user_id,kind,delta,ref,note) VALUES(?,?,?,?,?)').run(t.user_id, 'topup', Number(t.amount), topupId, 'Isi saldo');
    const cur = (db.prepare('SELECT amount FROM saldo WHERE user_id=?').get(t.user_id) || { amount: 0 }).amount;
    db.prepare('INSERT INTO saldo(user_id,amount) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET amount=excluded.amount').run(t.user_id, Number(cur) + Number(t.amount));
    return true;
  })(),
  resetTexts,
  productsByCat: (cat) => db.prepare(`SELECT p.*, (SELECT COUNT(*) FROM stock s WHERE s.product_id=p.id AND s.is_used=0) AS stock_n
      FROM products p WHERE p.category_id=? AND p.is_active=1 ORDER BY p.sort, p.name`).all(cat),
  allProducts: () => db.prepare(`SELECT p.*, c.name AS cat_name, (SELECT COUNT(*) FROM stock s WHERE s.product_id=p.id AND s.is_used=0) AS stock_n
      FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.sort, p.name`).all(),
  getProduct: (id) => db.prepare(`SELECT p.*, (SELECT COUNT(*) FROM stock s WHERE s.product_id=p.id AND s.is_used=0) AS stock_n FROM products p WHERE p.id=?`).get(id),
  searchProducts: (q) => db.prepare(`SELECT p.*, (SELECT COUNT(*) FROM stock s WHERE s.product_id=p.id AND s.is_used=0) AS stock_n
      FROM products p WHERE p.is_active=1 AND (p.name LIKE ? OR p.description LIKE ?) ORDER BY p.name LIMIT 20`).all(`%${q}%`, `%${q}%`),

  // ---- stock ----
  claimStock: (product_id, qty, order_id) => {
    const rows = db.prepare('SELECT id, content FROM stock WHERE product_id=? AND is_used=0 ORDER BY id LIMIT ?').all(product_id, qty);
    if (rows.length < qty) return null;
    const upd = db.prepare('UPDATE stock SET is_used=1, used_by_order=? WHERE id=?');
    const tx = db.transaction((rs) => rs.forEach(r => upd.run(order_id, r.id)));
    tx(rows);
    return rows.map(r => r.content);
  },

  // ---- orders ----
  createOrder: (o) => db.prepare(`INSERT INTO orders(order_id,user_id,product_id,product_name,qty,amount,discount,total,voucher_code,qris_image,qris_url,expired_at)
      VALUES(@order_id,@user_id,@product_id,@product_name,@qty,@amount,@discount,@total,@voucher_code,@qris_image,@qris_url,@expired_at)`).run(o),
  getOrder: (order_id) => db.prepare('SELECT * FROM orders WHERE order_id=?').get(order_id),
  markVccState: (order_id, state) => db.prepare('UPDATE orders SET senna_state=? WHERE order_id=?').run(state || '', order_id),
  setOrderQrisMsg: (order_id, chat, msg) => db.prepare('UPDATE orders SET qris_chat=?, qris_msgid=? WHERE order_id=?').run(String(chat || ''), Number(msg) || 0, order_id),
  setTopupQrisMsg: (topup_id, chat, msg) => db.prepare('UPDATE topups SET qris_chat=?, qris_msgid=? WHERE topup_id=?').run(String(chat || ''), Number(msg) || 0, topup_id),
  userOrders: (uid, limit = 10) => db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC LIMIT ?').all(uid, limit),
  pendingOrders: () => db.prepare("SELECT * FROM orders WHERE status='pending'").all(),
  setOrderStatus: (order_id, status, extra = {}) => {
    const o = module.exports.getOrder(order_id);
    if (!o) return false;
    const paid_at = status === 'paid' ? (extra.paid_at || new Date().toISOString()) : o.paid_at;
    db.prepare('UPDATE orders SET status=?, paid_at=?, delivered_content=COALESCE(NULLIF(?, \'\'), delivered_content) WHERE order_id=?')
      .run(status, paid_at, extra.delivered_content || '', order_id);
    return true;
  },
  orderStats: () => {
    const t = new Date().toISOString().slice(0, 10);
    return {
      today_revenue: db.prepare("SELECT COALESCE(SUM(total),0) v FROM orders WHERE status='paid' AND date(created_at)=?").get(t).v,
      today_orders: db.prepare("SELECT COUNT(*) c FROM orders WHERE date(created_at)=?").get(t).c,
      pending: db.prepare("SELECT COUNT(*) c FROM orders WHERE status='pending'").get().c,
      products: db.prepare('SELECT COUNT(*) c FROM products WHERE is_active=1').get().c,
      users: db.prepare('SELECT COUNT(*) c FROM users').get().c,
      month_revenue: db.prepare("SELECT COALESCE(SUM(total),0) v FROM orders WHERE status='paid' AND strftime('%Y-%m',created_at)=strftime('%Y-%m','now')").get().v,
    };
  },
  recentOrders: (limit = 15) => db.prepare(`SELECT o.*, u.username, u.first_name FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT ?`).all(limit),
  ordersByStatus: (status, limit = 50) => db.prepare('SELECT * FROM orders WHERE status=? ORDER BY id DESC LIMIT ?').all(status, limit),
  lowStock: (threshold) => db.prepare(`SELECT p.id, p.name, (SELECT COUNT(*) FROM stock s WHERE s.product_id=p.id AND s.is_used=0) AS n
      FROM products p WHERE p.type='digital' AND p.is_active=1`).all().filter(r => r.n <= threshold),

  // ---- vouchers ----
  getVoucher: (code) => db.prepare('SELECT * FROM vouchers WHERE UPPER(code)=UPPER(?) AND is_active=1').get(code),
  useVoucher: (code) => db.prepare('UPDATE vouchers SET used=used+1 WHERE UPPER(code)=UPPER(?)').run(code),

  // ---- tickets ----
  openTicket: (uid) => {
    let t = db.prepare("SELECT * FROM tickets WHERE user_id=? AND status='open' ORDER BY id DESC LIMIT 1").get(uid);
    if (!t) { const r = db.prepare('INSERT INTO tickets(user_id) VALUES(?)').run(uid); t = { id: r.lastInsertRowid, user_id: uid, status: 'open' }; }
    return t;
  },

  // ---- analytics ----
  revenueByDay: (days = 30) => db.prepare(`
    SELECT date(created_at) d, COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) revenue,
           COUNT(CASE WHEN status='paid' THEN 1 END) paid_n, COUNT(*) total_n
    FROM orders WHERE date(created_at) >= date('now', ?)
    GROUP BY d ORDER BY d`).all(`-${days} days`),
  topProducts: (limit = 10) => db.prepare(`
    SELECT oi.product_name name, SUM(oi.qty) qty, SUM(oi.qty*oi.price) revenue
    FROM order_items oi JOIN orders o ON o.order_id=oi.order_id
    WHERE o.status='paid' GROUP BY oi.product_id, oi.product_name
    ORDER BY revenue DESC LIMIT ?`).all(limit),
  statusBreakdown: () => db.prepare(`SELECT status, COUNT(*) c, COALESCE(SUM(total),0) v FROM orders GROUP BY status`).all(),
  hourlyPattern: () => db.prepare(`
    SELECT CAST(strftime('%H', created_at) AS INT) h, COUNT(*) c
    FROM orders WHERE status='paid' AND date(created_at) >= date('now','-30 days')
    GROUP BY h ORDER BY h`).all(),

  // ---- customers ----
  customers: () => db.prepare(`
    SELECT u.id, u.username, u.first_name, u.created_at,
      COUNT(o.id) orders_n,
      COUNT(CASE WHEN o.status='paid' THEN 1 END) paid_n,
      COALESCE(SUM(CASE WHEN o.status='paid' THEN o.total ELSE 0 END),0) spent,
      MAX(o.created_at) last_order
    FROM users u LEFT JOIN orders o ON o.user_id=u.id
    GROUP BY u.id ORDER BY spent DESC`).all(),
  customerDetail: (uid) => ({
    user: db.prepare('SELECT * FROM users WHERE id=?').get(uid),
    orders: db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 30').all(uid),
    saldo: (db.prepare('SELECT amount FROM saldo WHERE user_id=?').get(uid) || { amount: 0 }).amount,
    saldo_tx: db.prepare('SELECT * FROM saldo_tx WHERE user_id=? ORDER BY id DESC LIMIT 15').all(uid),
  }),
};
