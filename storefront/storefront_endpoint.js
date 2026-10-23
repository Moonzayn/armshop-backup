/* ===== Storefront publik (armshop.my.id) =====
   Hanya produk di luar lini VCC & akun yang ditampilkan di etalase web. */
const STOREFRONT_BLOCKED_CATS = new Set([
  'cat-5819de', // VCC
  'cat-a1f78f', // Akun Murah
  'cat-4e7c36', // Gmail Education
  'cat-1cf27b', // Jasa 2FA Gmail
  'ai_tools',   // AI & Productivity (refill/akun)
  'cat-c70404', // VPN (akun shared)
  'streaming', 'games', 'design',
]);
function storefrontSlug(name, id) {
  const base = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return (base || 'produk') + '-' + String(id).toLowerCase();
}
app.get('/api/storefront', (req, res) => {
  try {
    const cats = store.categories(true).filter(c => !STOREFRONT_BLOCKED_CATS.has(c.id));
    const catIds = new Set(cats.map(c => c.id));
    const stockMap = {};
    for (const r of store.db.prepare('SELECT product_id, COUNT(*) AS n FROM stock WHERE is_used=0 GROUP BY product_id').all()) stockMap[r.product_id] = r.n;
    const soldMap = {};
    for (const r of store.db.prepare("SELECT product_id, COUNT(*) AS n FROM orders WHERE status IN ('paid','delivered') GROUP BY product_id").all()) soldMap[r.product_id] = r.n;
    const products = store.allProducts()
      .filter(p => p.is_active && catIds.has(p.category_id) && p.type !== 'vcc')
      .map(p => {
        const desc = String(p.description || '').trim();
        const firstLine = (desc.split('\n').map(s => s.trim()).find(s => s.length > 10) || p.name).slice(0, 110);
        const includes = desc.split('\n').map(s => s.trim())
          .filter(s => /^(✅|✔|•|-|\*|✨|⚡|🔥)/.test(s))
          .map(s => s.replace(/^(✅|✔|•|-|\*|✨|⚡|🔥)\s*/, ''))
          .filter(s => s.length > 2 && s.length < 90).slice(0, 6);
        const stockN = stockMap[p.id] || 0;
        const isDigital = p.type === 'digital';
        const stock = isDigital
          ? (stockN >= 4 ? { status: 'in', count: stockN } : stockN >= 1 ? { status: 'low', count: stockN } : { status: 'preorder' })
          : { status: 'in' };
        return {
          id: p.id,
          slug: storefrontSlug(p.name, p.id),
          name: p.name,
          category: p.category_id,
          tagline: firstLine,
          description: desc || p.name,
          price: p.price,
          sold: soldMap[p.id] || 0,
          stock,
          delivery: isDigital
            ? { type: 'instant', label: 'Pengiriman otomatis', eta: 'dalam hitungan detik setelah pembayaran' }
            : { type: 'manual', label: 'Diproses admin', eta: 'setelah pembayaran terkonfirmasi' },
          includes,
          faqs: [
            { q: 'Bagaimana cara memesan?', a: 'Tambahkan produk ke keranjang, lanjutkan ke checkout di halaman ini, lalu selesaikan pembayaran lewat bot Telegram @lacukbot dengan QRIS. Pesananmu diteruskan ke admin untuk diproses.' },
            { q: 'Bagaimana produk dikirim?', a: isDigital ? 'Produk digital dikirim otomatis setelah pembayaran terkonfirmasi.' : 'Produk ini diproses manual oleh admin setelah pembayaran terkonfirmasi; kamu akan dihubungi lewat Telegram/WhatsApp.' },
            { q: 'Kalau ada kendala dengan pesanan saya?', a: 'Hubungi admin lewat bot Telegram @lacukbot dengan menyertakan kode pesananmu — kami bantu sampai selesai.' },
          ],
          tags: String(p.name).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2),
          createdAt: p.created_at || null,
        };
      });
    const usedCatIds = new Set(products.map(p => p.category));
    res.json({
      categories: cats.filter(c => usedCatIds.has(c.id)).map(c => ({ id: c.id, name: c.name })),
      products,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
