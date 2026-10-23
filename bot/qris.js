// KlikQRIS client — https://klikqris.com/api
class KlikQris {
  constructor() {
    this.apiKey = process.env.KLIKQRIS_API_KEY || '';
    this.merchantId = String(process.env.KLIKQRIS_MERCHANT_ID || '');
    this.baseUrl = (process.env.KLIKQRIS_BASE_URL || 'https://klikqris.com/api').replace(/\/+$/, '');
  }
  headers() {
    return { 'Content-Type': 'application/json', 'x-api-key': this.apiKey, 'id_merchant': this.merchantId };
  }
  async _get(path) {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.status === false) throw new Error(json?.message || `KlikQRIS HTTP ${res.status}`);
    return json.data;
  }
  async _post(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.status === false) throw new Error(json?.message || `KlikQRIS HTTP ${res.status}`);
    return json.data;
  }
  // Buat tagihan QRIS dinamis (retry 3x kalau gateway "server busy"/50x)
  async create({ orderId, amount, keterangan, callbackUrl }) {
    const body = {
      order_id: String(orderId),
      id_merchant: this.merchantId,
      amount: Math.round(Number(amount)),
      keterangan: keterangan || `Order ${orderId}`,
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
    };
    const delays = [2000, 4000];
    for (let i = 0; i <= delays.length; i++) {
      try {
        return await this._post('/qris/create', body);
      } catch (e) {
        const busy = /busy|try again|timeout|temporarily|503|502|network|fetch/i.test(String(e.message));
        if (i < delays.length && busy) await new Promise(r => setTimeout(r, delays[i]));
        else throw e;
      }
    }
  }
  // Cek status transaksi
  status(orderId) { return this._get(`/qris/status/${encodeURIComponent(orderId)}`); }
  // Riwayat transaksi (cash in)
  history(page = 1) { return this._get(`/qris/history?page=${page}`); }
  // Status penarikan dana / withdrawal (cash out)
  withdrawals(params = {}) {
    const q = new URLSearchParams({ limit: '20', ...params }).toString();
    return this._get(`/withdraw/orders?${q}`);
  }
  // Ambil gambar QR sebagai Buffer (mendukung data URI base64 maupun URL)
  async qrBuffer(qrisImage) {
    if (!qrisImage) return null;
    const m = String(qrisImage).match(/^data:image\/\w+;base64,(.+)$/);
    if (m) return Buffer.from(m[1], 'base64');
    const res = await fetch(qrisImage);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }
}
module.exports = new KlikQris();
