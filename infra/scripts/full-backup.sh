#!/bin/bash
# Snapshot PENUH mingguan (termasuk .env & konfigurasi) — HANYA lokal, TIDAK ke GitHub.
set -e
TS=$(TZ=Asia/Jakarta date +%Y%m%d)
DIR=/home/ubuntu/backups/full
OUT=$DIR/armshop-full-$TS.tar.gz
mkdir -p "$DIR"

ARGS=()
[ -d /home/ubuntu/lacukai-bot ] && ARGS+=(-C /home/ubuntu lacukai-bot)
[ -d /home/ubuntu/botcast ] && ARGS+=(-C /home/ubuntu botcast)
[ -d /home/ubuntu/armshop-backup ] && ARGS+=(-C /home/ubuntu armshop-backup)
[ -f /home/ubuntu/.pm2/dump.pm2 ] && ARGS+=(-C /home/ubuntu .pm2/dump.pm2)
ARGS+=(-C / var/www/armshop etc/nginx/sites-enabled etc/nginx/sites-available)

tar -czf "$OUT.tmp" \
  --exclude='lacukai-bot/node_modules' \
  --exclude='botcast/node_modules' \
  --exclude='lacukai-bot/shop.sqlite-shm' \
  "${ARGS[@]}"
mv "$OUT.tmp" "$OUT"

# simpan 4 snapshot terakhir
ls -t $DIR/armshop-full-*.tar.gz | tail -n +5 | xargs -r rm -f
echo "full backup OK: $OUT ($(du -h "$OUT" | cut -f1))"
