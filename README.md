# Armshop Backup — La Cukai Shop

Backup otomatis untuk **La Cukai Shop** (bot Telegram @lacukbot, admin
https://admin.armshop.my.id, storefront https://armshop.my.id) yang berjalan di
server AWS `54.253.97.220`. Repo ini **privat** dan hanya berisi kode + snapshot
database — BUKAN kredensial.

## Isi repo

| Folder | Isi | Diperbarui |
|---|---|---|
| `bot/` | Source code bot + web admin (`~/lacukai-bot` di server), tanpa `node_modules`, `.env`, dan file database live | Harian 03:30 WIB |
| `storefront/` | Source code storefront web (React/Vite) | Saat ada perubahan (manual/agent) |
| `storefront-deployed/` | File `index.html` hasil build yang sedang live di `/var/www/armshop` | Harian 03:30 WIB |
| `db/` | Snapshot database `shop-YYYYMMDD.sqlite.gz` (maks. 14 hari terakhir) | Harian 03:30 WIB |
| `infra/` | Salinan konfigurasi nginx (sites), daftar unit systemd & timer backup | Harian 03:30 WIB |

## Yang TIDAK ada di repo ini (sengaja)

- **`.env`** (token bot, API key KlikQRIS, password admin) dan **snapshot penuh**
  tersimpan HANYA di server: `~/backups/full/armshop-full-*.tar.gz`
  (dibuat mingguan, disimpan 4 terakhir). Alasannya: kredensial tidak boleh
  masuk Git — walaupun repo privat.
- Snapshot database **per jam** (48 terakhir) ada di server: `~/backups/db/`.
  Yang masuk Git hanya snapshot harian.

## Jadwal backup (systemd timer di server, zona Asia/Jakarta)

| Timer | Jadwal | Fungsi |
|---|---|---|
| `armshop-backup-db.timer` | Tiap jam | Backup database online (aman saat bot berjalan) ke `~/backups/db` |
| `armshop-backup-sync.timer` | Harian 03:30 WIB | Sinkron kode + snapshot DB harian + infra ke repo ini |
| `armshop-backup-full.timer` | Minggu 04:00 WIB | Snapshot penuh (kode + .env + web + konfigurasi) ke `~/backups/full` |

Semua script ada di server: `~/armshop-backup/*.sh` (dan tercantum di `infra/`).

## Cara restore

### Database saja (kasus paling umum)
1. Ambil snapshot dari `db/` repo ini (atau `~/backups/db/` di server bila masih bisa SSH).
2. Di server:
   ```bash
   pm2 stop lacukai-bot
   cd ~/lacukai-bot
   cp shop.sqlite shop.sqlite.sebelum-restore
   rm -f shop.sqlite-wal shop.sqlite-shm
   gunzip -c /path/ke/shop-YYYYMMDD.sqlite.gz > shop.sqlite   # bila dari .gz
   pm2 start lacukai-bot
   ```
   Atau pakai script: `~/armshop-backup/restore-db.sh <file-snapshot>` (otomatis stop → tukar → start).

### Kode bot/admin
Salin isi `bot/` ke `~/lacukai-bot`, `npm install`, buat ulang `.env` (dari
snapshot penuh atau minta ke owner), lalu `pm2 restart lacukai-bot`.

### Storefront web
`cd storefront && npm install && npm run build`, lalu salin `dist/index.html`
ke `/var/www/armshop/index.html` (atau pakai file di `storefront-deployed/`).

### Server hilang total
1. Buat instance baru, install Node.js 22 + PM2 + nginx.
2. Restore kode + database seperti di atas, ambil `.env` dan konfigurasi dari
   snapshot penuh terakhir (satu-satunya salinan .env ada di sana — simpan juga
   salinannya di tempat aman lain bila perlu).
3. Arahkan DNS `armshop.my.id` + `admin.armshop.my.id` ke IP baru, terbitkan
   ulang sertifikat Let's Encrypt.
