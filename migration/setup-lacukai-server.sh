#!/bin/bash
# ============================================================================
# SETUP SERVER BARU — La Cukai Shop (@lacukbot + web admin + storefront)
# Cara pakai:
#   1. Upload file ini + lacukai-server-bundle.tar.gz ke home server baru
#      (satu folder yang sama), lalu jalankan:
#          bash setup-lacukai-server.sh
#   2. Jawab pertanyaan yang muncul (isi token/kunci — ketikan disembunyikan).
#      Siapkan .env server lama di samping kamu untuk copy-paste nilai.
#   3. Ikuti CHECKLIST AKHIR di bawah (DNS + matikan bot lama dulu!).
#
# Yang TIDAK ada di script ini (sengaja): semua token & kunci rahasia.
# Script ini tidak mengirim apa pun ke GitHub. .env dibuat lokal, chmod 600.
# ============================================================================
set -e
cd "$(dirname "$0")"
USER_NOW="$(whoami)"
HOME_DIR="$HOME"

# --- Kalau dijalankan sebagai root, pindah ke user ubuntu (standar droplet) ---
if [ "$USER_NOW" = "root" ] && [ -z "$LACUKAI_AS_UBUNTU" ]; then
  id ubuntu >/dev/null 2>&1 || useradd -m -s /bin/bash ubuntu
  usermod -aG sudo ubuntu 2>/dev/null || true
  cp "$0" lacukai-server-bundle.tar.gz /home/ubuntu/ 2>/dev/null || true
  chown ubuntu:ubuntu /home/ubuntu/setup-lacukai-server.sh /home/ubuntu/lacukai-server-bundle.tar.gz 2>/dev/null || true
  echo "Dijalankan ulang sebagai user ubuntu..."
  exec su - ubuntu -c "LACUKAI_AS_UBUNTU=1 bash /home/ubuntu/setup-lacukai-server.sh"
fi

echo "=============================================================="
echo " SETUP SERVER BARU — La Cukai Shop"
echo " Server: $(lsb_release -d 2>/dev/null | cut -f2 || echo Ubuntu)"
echo " User  : $USER_NOW   Home: $HOME_DIR"
echo "=============================================================="

ask()      { read -r -p "$1 [$2]: " V; echo "${V:-$2}"; }
asksecret(){ read -r -s -p "$1: " V; echo; echo "$V"; }
echo ""
echo "PENTING — urutan migrasi yang benar:"
echo "  1. Setup server baru ini sampai selesai (bot JANGAN di-start dulu"
echo "     kalau bot lama masih jalan — nanti tabrakan polling Telegram)."
echo "  2. Arahkan DNS armshop.my.id + admin + botcast ke IP server baru."
echo "  3. MATIKAN bot di server lama (pm2 stop lacukai-bot)."
echo "  4. Baru start bot di server baru, lalu tes /start dan web admin."
echo ""
read -r -p "Lanjut? (y/N) " GO
[ "$GO" = "y" ] || [ "$GO" = "Y" ] || { echo "Dibatalkan."; exit 0; }

# ---------------------------------------------------------------- 1. Paket
echo ""
echo "[1/8] Install paket sistem + Node.js 22 + PM2..."
sudo apt-get update -qq
sudo apt-get install -y -qq curl git nginx sqlite3 python3 certbot python3-certbot-nginx >/dev/null
if ! command -v node >/dev/null 2>&1 || [ "$(node -v 2>/dev/null | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - >/dev/null
  sudo apt-get install -y -qq nodejs >/dev/null
fi
command -v pm2 >/dev/null 2>&1 || sudo npm install -g pm2 >/dev/null
echo "      node $(node -v) | npm $(npm -v) | pm2 $(pm2 -v)"

# ---------------------------------------------------------------- 2. Bundle
echo ""
echo "[2/8] Bongkar bundle kode..."
[ -f lacukai-server-bundle.tar.gz ] || { echo "ERROR: lacukai-server-bundle.tar.gz tidak ada di folder ini."; exit 1; }
tar xzf lacukai-server-bundle.tar.gz
cp -r lacukai-bundle/lacukai-bot "$HOME_DIR/" 2>/dev/null || true
cp -r lacukai-bundle/armshop-backup "$HOME_DIR/" 2>/dev/null || true
cp -r lacukai-bundle/systemd "$HOME_DIR/" 2>/dev/null || true
ls "$HOME_DIR/lacukai-bot/index.js" >/dev/null

# ---------------------------------------------------------------- 3. .env
echo ""
echo "[3/8] Konfigurasi (.env) — ketikan rahasia disembunyikan."
if [ -f "$HOME_DIR/lacukai-bot/.env" ]; then
  echo "      .env sudah ada — dilewati (tidak ditimpa)."
else
  echo "      (Lihat nilai-nilai ini di .env server lama.)"
  BOT_TOKEN=$(asksecret "BOT_TOKEN (token bot @lacukbot)")
  [ -n "$BOT_TOKEN" ] || { echo "ERROR: BOT_TOKEN wajib diisi."; exit 1; }
  ADMIN_IDS=$(ask "ADMIN_IDS (ID Telegram admin)" "8815867386")
  ADMIN_PASSWORD=$(asksecret "ADMIN_PASSWORD (password login web admin)")
  KLIKQRIS_MERCHANT_ID=$(ask "KLIKQRIS_MERCHANT_ID" "")
  KLIKQRIS_API_KEY=$(asksecret "KLIKQRIS_API_KEY")
  KLIKQRIS_BASE_URL=$(ask "KLIKQRIS_BASE_URL" "")
  SENNA_BASE_URL=$(ask "SENNA_BASE_URL" "")
  SENNA_TENANT_ID=$(ask "SENNA_TENANT_ID" "")
  SENNA_KEY_ID=$(ask "SENNA_KEY_ID" "")
  SENNA_API_SECRET=$(asksecret "SENNA_API_SECRET")
  SENNA_OTP_SECRET=$(asksecret "SENNA_OTP_SECRET (boleh kosong kalau belum pakai relay OTP)")
  OTP_API_ID=$(ask "OTP_API_ID (boleh kosong)" "")
  OTP_API_HASH=$(asksecret "OTP_API_HASH (boleh kosong, Enter saja)")
  USERBOT_SESSION=$(asksecret "USERBOT_SESSION (boleh kosong, Enter saja)")
  WEB_PORT=$(ask "WEB_PORT" "7101")
  INVOICE_EXPIRE_MINUTES=$(ask "INVOICE_EXPIRE_MINUTES" "60")
  PUBLIC_URL=$(ask "PUBLIC_URL" "https://armshop.my.id")
  cat > "$HOME_DIR/lacukai-bot/.env" <<EOF
BOT_TOKEN=$BOT_TOKEN
KLIKQRIS_API_KEY=$KLIKQRIS_API_KEY
KLIKQRIS_MERCHANT_ID=$KLIKQRIS_MERCHANT_ID
KLIKQRIS_BASE_URL=$KLIKQRIS_BASE_URL
ADMIN_IDS=$ADMIN_IDS
WEB_PORT=$WEB_PORT
ADMIN_PASSWORD=$ADMIN_PASSWORD
INVOICE_EXPIRE_MINUTES=$INVOICE_EXPIRE_MINUTES
PUBLIC_URL=$PUBLIC_URL
SENNA_BASE_URL=$SENNA_BASE_URL
SENNA_TENANT_ID=$SENNA_TENANT_ID
SENNA_KEY_ID=$SENNA_KEY_ID
SENNA_API_SECRET=$SENNA_API_SECRET
OTP_API_ID=$OTP_API_ID
OTP_API_HASH=$OTP_API_HASH
USERBOT_SESSION=$USERBOT_SESSION
SENNA_OTP_SECRET=$SENNA_OTP_SECRET
EOF
  chmod 600 "$HOME_DIR/lacukai-bot/.env"
  echo "      .env ditulis (chmod 600)."
fi

# ---------------------------------------------------------------- 4. NPM
echo ""
echo "[4/8] Install dependency Node..."
(cd "$HOME_DIR/lacukai-bot" && npm ci --omit=dev >/dev/null 2>&1 || npm install --omit=dev >/dev/null)
echo "      lacukai-bot OK."
read -r -p "Pasang botcast juga? (y/N) " WITH_BC
if [ "$WITH_BC" = "y" ] || [ "$WITH_BC" = "Y" ]; then
  cp -r lacukai-bundle/botcast "$HOME_DIR/" 2>/dev/null || true
  (cd "$HOME_DIR/botcast" && npm ci --omit=dev >/dev/null 2>&1 || npm install --omit=dev >/dev/null)
  echo "      botcast OK. (Catatan: sesi login botcast TIDAK ikut pindah — login ulang nanti.)"
fi

# ---------------------------------------------------------------- 5. Database
echo ""
echo "[5/8] Database..."
if ls shop-*.sqlite.gz >/dev/null 2>&1; then
  DBF=$(ls -t shop-*.sqlite.gz | head -1)
  echo "      Backup ditemukan: $DBF — restore..."
  gunzip -c "$DBF" > "$HOME_DIR/lacukai-bot/shop.sqlite"
  rm -f "$HOME_DIR/lacukai-bot/shop.sqlite-wal" "$HOME_DIR/lacukai-bot/shop.sqlite-shm"
elif [ -f shop.sqlite ]; then
  cp shop.sqlite "$HOME_DIR/lacukai-bot/shop.sqlite"
  echo "      shop.sqlite disalin."
else
  echo "      Tidak ada backup DB di folder ini."
  echo "      Bot akan membuat database kosong otomatis saat pertama start."
  echo "      (Kalau mau bawa data lama: copy file shop-*.sqlite.gz dari"
  echo "       folder ~/backups/db server lama ke sini, lalu jalankan ulang"
  echo "       bagian restore: gunzip -c shop-TERBARU.sqlite.gz > ~/lacukai-bot/shop.sqlite)"
fi

# ---------------------------------------------------------------- 6. Nginx
echo ""
echo "[6/8] Nginx (HTTP dulu, HTTPS menyusul setelah DNS mengarah)..."
DOMAIN=$(ask "DOMAIN utama" "armshop.my.id")
sudo tee /etc/nginx/sites-available/lacukai >/dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN admin.$DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:7101;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
if [ -d "$HOME_DIR/botcast" ]; then
sudo tee /etc/nginx/sites-available/botcast >/dev/null <<EOF
server {
    listen 80;
    server_name botcast.$DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:8811;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/botcast /etc/nginx/sites-enabled/botcast
fi
sudo ln -sf /etc/nginx/sites-available/lacukai /etc/nginx/sites-enabled/lacukai
sudo nginx -t && sudo systemctl reload nginx
echo "      Nginx OK (HTTP)."
read -r -p "DNS sudah mengarah ke server ini? Kalau ya, pasang HTTPS sekarang (y/N) " WITH_SSL
if [ "$WITH_SSL" = "y" ] || [ "$WITH_SSL" = "Y" ]; then
  read -r -p "Email untuk Certbot: " CB_EMAIL
  DOMAINS="-d $DOMAIN -d www.$DOMAIN -d admin.$DOMAIN"
  [ -d "$HOME_DIR/botcast" ] && DOMAINS="$DOMAINS -d botcast.$DOMAIN"
  # shellcheck disable=SC2086
  sudo certbot --nginx $DOMAINS --non-interactive --agree-tos -m "$CB_EMAIL" --redirect || \
    echo "      Certbot gagal (biasanya DNS belum mengarah). Ulangi nanti: sudo certbot --nginx"
else
  echo "      HTTPS dilewati. Setelah DNS mengarah, jalankan: sudo certbot --nginx"
fi

# ---------------------------------------------------------------- 7. IPv6
echo ""
echo "[7/8] Cek jalur IPv6 (pelajaran dari server lama: IPv6 rusak = bot macet)..."
if curl -s -o /dev/null --max-time 10 -6 https://www.google.com/ 2>/dev/null; then
  echo "      IPv6 OK, tidak perlu perbaikan."
else
  echo "      IPv6 server ini RUSAK (sama seperti server lama)."
  echo "      Pilih perbaikan: 1) pin api.telegram.org ke IPv4  2) matikan IPv6 sistem  3) lewati"
  read -r -p "Pilihan (1/2/3) [1]: " IPV6FIX
  IPV6FIX="${IPV6FIX:-1}"
  if [ "$IPV6FIX" = "1" ]; then
    grep -q "api.telegram.org" /etc/hosts || echo "149.154.166.110 api.telegram.org" | sudo tee -a /etc/hosts >/dev/null
    echo "      Pin hosts dipasang (cek ulang berkala kalau Telegram ganti IP)."
  elif [ "$IPV6FIX" = "2" ]; then
    echo "net.ipv6.conf.all.disable_ipv6 = 1" | sudo tee /etc/sysctl.d/99-disable-ipv6.conf >/dev/null
    echo "net.ipv6.conf.default.disable_ipv6 = 1" | sudo tee -a /etc/sysctl.d/99-disable-ipv6.conf >/dev/null
    sudo sysctl -p /etc/sysctl.d/99-disable-ipv6.conf >/dev/null
    echo "      IPv6 dimatikan (berlaku untuk koneksi baru; restart bot setelah ini)."
  else
    echo "      Dilewati — bot bisa macet seperti di server lama."
  fi
fi

# ---------------------------------------------------------------- 8. PM2 + systemd
echo ""
echo "[8/8] PM2 + watchdog + backup otomatis..."
(cd "$HOME_DIR/lacukai-bot" && pm2 start index.js --name lacukai-bot >/dev/null)
[ -d "$HOME_DIR/botcast" ] && (cd "$HOME_DIR/botcast" && pm2 start server.js --name botcast >/dev/null || true)
pm2 save >/dev/null
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USER_NOW" --hp "$HOME_DIR" >/dev/null 2>&1 || \
  echo "      (pm2 startup perlu dijalankan manual — lihat output pm2 startup)"
sudo cp "$HOME_DIR/systemd/lacukai-watchdog.service" "$HOME_DIR/systemd/lacukai-watchdog.timer" /etc/systemd/system/ 2>/dev/null || \
  sudo cp lacukai-bundle/systemd/lacukai-watchdog.* /etc/systemd/system/
sudo sed -i "s|/home/ubuntu|$HOME_DIR|g" /etc/systemd/system/lacukai-watchdog.*
sudo systemctl daemon-reload
sudo systemctl enable --now lacukai-watchdog.timer >/dev/null 2>&1 || true
if [ -f "$HOME_DIR/armshop-backup/install-timers.sh" ]; then
  sed "s|/home/ubuntu|$HOME_DIR|g" "$HOME_DIR/armshop-backup/install-timers.sh" > /tmp/install-timers-new.sh
  bash /tmp/install-timers-new.sh >/dev/null 2>&1 || echo "      (timer backup perlu dicek manual)"
  sudo systemctl daemon-reload
  sudo systemctl enable --now armshop-backup-db.timer armshop-backup-sync.timer armshop-backup-full.timer >/dev/null 2>&1 || true
fi
echo ""
echo "=============================================================="
echo " SELESAI — status:"
pm2 list 2>/dev/null | grep -E "lacukai-bot|botcast" || pm2 list
echo ""
echo " CHECKLIST SETELAH INI (jangan dilewati):"
echo "  [ ] 1. Arahkan DNS (IDCloudHost): A armshop + www + admin + botcast"
echo "         -> IP server baru ini."
echo "  [ ] 2. Kalau HTTPS tadi dilewati: sudo certbot --nginx"
echo "  [ ] 3. MATIKAN bot di server LAMA dulu: pm2 stop lacukai-bot"
echo "         (kalau tidak, bot lama & baru tabrakan polling -> 409)"
echo "  [ ] 4. Tes: kirim /start ke @lacukbot, buka https://admin.$DOMAIN"
echo "  [ ] 5. GitHub sync: salin deploy key dari server lama (~/.ssh/github_backup*)"
echo "         atau buat deploy key baru dan daftarkan ke repo Moonzayn/armshop-backup."
echo "  [ ] 6. Relay OTP: pastikan akun listener VPS masih jadi anggota channel Otp cc."
echo "=============================================================="
