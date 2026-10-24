#!/bin/bash
# Sinkron harian ke GitHub (repo privat Moonzayn/armshop-backup):
# kode bot + storefront live + snapshot DB harian + infra
set -e
export GIT_SSH_COMMAND='ssh -i /home/ubuntu/.ssh/github_backup -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new'
REPO=/home/ubuntu/armshop-backup-repo

# 1) pastikan ada snapshot DB segar
/home/ubuntu/armshop-backup/backup-db.sh > /dev/null

# 2) kode bot (tanpa node_modules, .env, database live, log)
mkdir -p "$REPO/bot"
rsync -a --delete \
  --exclude node_modules --exclude .env --exclude 'shop.sqlite*' \
  --exclude 'bot.log' --exclude '*.log' \
  /home/ubuntu/lacukai-bot/ "$REPO/bot/"

# 3) storefront yang sedang live (hasil build)
mkdir -p "$REPO/storefront-deployed"
cp /var/www/armshop/index.html "$REPO/storefront-deployed/index.html"

# 4) snapshot DB harian (di git maks. 14 berkas terakhir)
mkdir -p "$REPO/db"
DAY=$(TZ=Asia/Jakarta date +%Y%m%d)
NEWEST=$(ls -t /home/ubuntu/backups/db/shop-*.sqlite.gz | head -1)
cp "$NEWEST" "$REPO/db/shop-$DAY.sqlite.gz"
ls "$REPO/db"/shop-*.sqlite.gz | sort | head -n -14 | xargs -r rm -f

# 5) infra: nginx, unit systemd backup, script backup, dump pm2
mkdir -p "$REPO/infra/scripts"
cp /etc/nginx/sites-enabled/* "$REPO/infra/" 2>/dev/null || true
systemctl cat armshop-backup-db.service armshop-backup-db.timer armshop-backup-sync.service armshop-backup-sync.timer armshop-backup-full.service armshop-backup-full.timer > "$REPO/infra/systemd-backup-units.txt" 2>/dev/null || true
cp /etc/systemd/system/lacukai-watchdog.service /etc/systemd/system/lacukai-watchdog.timer "$REPO/infra/" 2>/dev/null || true
cp /home/ubuntu/armshop-backup/*.sh /home/ubuntu/armshop-backup/*.js "$REPO/infra/scripts/" 2>/dev/null || true
cp /home/ubuntu/.pm2/dump.pm2 "$REPO/infra/" 2>/dev/null || true

# 6) commit + push bila ada perubahan
cd "$REPO"
git add -A
if git diff --cached --quiet; then
  echo "sync: tidak ada perubahan"
  exit 0
fi
git commit -q -m "backup harian $(TZ=Asia/Jakarta date +%Y-%m-%d)"
git push -q origin main
echo "sync OK: ter-push ke GitHub"
