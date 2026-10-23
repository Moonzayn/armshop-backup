// Migrasi satu kali: produk + kategori + stok (belum terpakai) dari shop.sqlite lama.
const path = require('path');
const Old = require('better-sqlite3')(path.join('/home/ubuntu/zetshop-panel/instances/T01/shop.sqlite'), { readonly: true });
const store = require('./db');
const db = store.db;

const cats = Old.prepare('SELECT id, name FROM categories').all();
const insCat = db.prepare('INSERT OR IGNORE INTO categories(id,name,sort) VALUES(?,?,?)');
cats.forEach((c, i) => insCat.run(c.id, c.name, i));

const prods = Old.prepare('SELECT id, category_id, name, description, price, type FROM products').all();
const insProd = db.prepare(`INSERT OR IGNORE INTO products(id,category_id,name,description,price,type,photo_url,is_active,sort) VALUES(?,?,?,?,?,?,?,1,?)`);
prods.forEach((p, i) => insProd.run(p.id, p.category_id, p.name, p.description || '', p.price, p.type || 'digital', '', i));

const stocks = Old.prepare('SELECT product_id, content FROM product_stock WHERE is_used=0').all();
const insStock = db.prepare('INSERT INTO stock(product_id,content) VALUES(?,?)');
const tx = db.transaction(rows => rows.forEach(r => insStock.run(r.product_id, r.content)));
tx(stocks);

console.log(`migrated: ${cats.length} kategori, ${prods.length} produk, ${stocks.length} stok`);
// set owner as admin
const owner = Number(process.env.ADMIN_IDS?.split(',')[0]);
if (owner) { store.upsertUser(owner, '', 'Owner'); db.prepare('UPDATE users SET is_admin=1 WHERE id=?').run(owner); console.log('admin set:', owner); }
