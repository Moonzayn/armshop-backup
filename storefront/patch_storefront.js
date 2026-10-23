const fs = require('fs');
const src = fs.readFileSync('web.js', 'utf8');
const endpoint = fs.readFileSync('/tmp/storefront_endpoint.js', 'utf8');
if (src.includes('/api/storefront')) {
  console.log('sudah ada, lewati');
  process.exit(0);
}
const anchor = 'app.use(auth);';
if (!src.includes(anchor)) {
  console.error('anchor app.use(auth) tidak ditemukan');
  process.exit(1);
}
fs.writeFileSync('web.js', src.replace(anchor, endpoint + '\n' + anchor, 1));
console.log('endpoint storefront ditambahkan SEBELUM gerbang auth');
