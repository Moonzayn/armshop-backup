// Senn AutoOrder (VCC provider) client — HMAC-SHA256 Partner API
const crypto = require('crypto');

const BASE_URL = (process.env.SENNA_BASE_URL || 'https://sennastore.biz.id').replace(/\/+$/, '');
const TENANT_ID = process.env.SENNA_TENANT_ID || '';
const KEY_ID = process.env.SENNA_KEY_ID || '';
const SECRET = process.env.SENNA_API_SECRET || '';

const enabled = () => !!(TENANT_ID && KEY_ID && SECRET);

function sign({ method, path, body = '' }) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
  const canonical = [method.toUpperCase(), path, timestamp, nonce, bodyHash].join('\n');
  const signature = crypto.createHmac('sha256', SECRET).update(canonical).digest('hex');
  return {
    'Content-Type': 'application/json',
    'x-api-key': KEY_ID,
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-signature': signature,
  };
}

async function call(method, path, payload = null) {
  const raw = payload === null ? '' : JSON.stringify(payload);
  const headers = sign({ method, path, body: raw });
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: method === 'GET' ? undefined : raw,
    timeout: 60000,
  });
  let data;
  try { data = await res.json(); } catch (e) { data = {}; }
  if (!res.ok) {
    const err = new Error(`${data.code || 'error'}: ${data.message || 'request gagal'}`);
    err.code = data.code || 'unknown';
    err.httpCode = res.status;
    throw err;
  }
  return data;
}

const resPath = (s) => `/v1/resellers/${TENANT_ID}${s}`;

// ---- katalog (cache 60 detik) ----
let catalogCache = { at: 0, list: [] };
async function catalog(force = false) {
  if (!force && catalogCache.list.length && Date.now() - catalogCache.at < 60_000) return catalogCache.list;
  const d = await call('GET', resPath('/catalog'));
  catalogCache = { at: Date.now(), list: d.products || [] };
  return catalogCache.list;
}
function catalogCacheGet() { return catalogCache; }
const findProduct = async (sennaId) => (await catalog()).find((p) => p.id === sennaId) || null;

// ---- saldo (cache: sukses 60 detik, gagal 15 detik) ----
let balCache = { at: 0, val: null, ok: false };
async function balance() {
  if (Date.now() - balCache.at < (balCache.ok ? 60_000 : 15_000)) return balCache.ok ? balCache.val : null;
  try {
    const v = await call('GET', resPath('/balance'));
    balCache = { at: Date.now(), val: Number(v.deposit), ok: true };
    return balCache.val;
  } catch (e) {
    balCache = { at: Date.now(), val: null, ok: false };
    return null;
  }
}
const createOrder = async (externalId, productId, { quantity = 1, customPurpose = null, saleAmount = null } = {}) =>
  call('POST', resPath(`/orders/${encodeURIComponent(externalId)}`), {
    product_id: productId,
    quantity,
    ...(customPurpose ? { custom_purpose: String(customPurpose).slice(0, 200) } : {}),
    ...(saleAmount != null ? { sale_amount: Number(saleAmount) } : {}),
  });
const getOrder = (externalId) => call('GET', resPath(`/orders/${encodeURIComponent(externalId)}`));
const getDelivery = (externalId) => call('GET', resPath(`/orders/${encodeURIComponent(externalId)}/delivery`));

// polling sampai final, return { status, error?, items? }
async function waitForDelivery(externalId, { maxMs = 90_000 } = {}) {
  const start = Date.now();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (;;) {
    const order = await getOrder(externalId);
    if (order.status === 'COMPLETED') {
      const d = await getDelivery(externalId);
      return { status: 'COMPLETED', items: d.items || [], orderId: order };
    }
    if (order.status === 'FAILED') return { status: 'FAILED', error: order.error || 'unknown', orderId: order };
    if (Date.now() - start > maxMs) return { status: order.status, timeout: true, orderId: order };
    await sleep(3000);
  }
}

// "CARD 5334-1234-5678-9012|10/28|123" -> { number, exp, cvv }
function parseCard(str) {
  const raw = String(str).trim();
  const s = raw.replace(/\s+/g, '');
  // format supplier aktual — nomor|CVV|MM/YY
  let m = s.match(/CARD?([\d-]+)\|(\d{3,4})\|(\d{2}\/\d{2,4})/);
  if (m) return { raw, number: m[1], exp: m[3], cvv: m[2] };
  // buku-dok: CARD nnnn-...|MM/YY|CVV
  m = s.match(/CARD?([\d-]+)\|(\d{2}\/\d{2,4})\|(\d{3,4})/);
  if (m) return { raw, number: m[1], exp: m[2], cvv: m[3] };
  // fallback: pola apapun dengan dua angka + tanggal
  m = s.match(/(\d[\d-]{8,})\|?(\d{3,4})\|?(\d{2}\/\d{2,4})/);
  if (m) return { raw, number: m[1], exp: m[3], cvv: m[2] };
  m = s.match(/(\d[\d-]{8,})\|?(\d{2}\/\d{2,4})\|?(\d{3,4})/);
  if (m) return { raw, number: m[1], exp: m[2], cvv: m[3] };
  // fallback terakhir: nomor panjang saja
  m = s.match(/(\d[\d-]{11,})/);
  if (m) return { raw, number: m[1], exp: '', cvv: '' };
  return { raw, number: '', exp: '', cvv: '' };
}

module.exports = {
  enabled, call, balance, catalog, catalogCacheGet, findProduct,
  createOrder, getOrder, getDelivery, waitForDelivery, parseCard,
};
