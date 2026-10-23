#!/bin/bash
# Restore database dari snapshot. Pakai: restore-db.sh <file .sqlite | .sqlite.gz>
set -e
SRC="$1"
if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
  echo "File snapshot tidak ditemukan: $SRC"
  echo "Contoh: restore-db.sh ~/backups/db/shop-20261023-0513.sqlite.gz"
  exit 1
fi
cd /home/ubuntu/lacukai-bot
pm2 stop lacukai-bot || true
cp shop.sqlite "shop.sqlite.sebelum-restore-$(date +%Y%m%d-%H%M%S)"
rm -f shop.sqlite-wal shop.sqlite-shm
case "$SRC" in
  *.gz) gunzip -c "$SRC" > shop.sqlite ;;
  *) cp "$SRC" shop.sqlite ;;
esac
pm2 start lacukai-bot
echo "Restore selesai dari: $SRC"
