#!/bin/bash
# Backup database per jam + kompres + prune (simpan 48 jam terakhir)
set -e
node /home/ubuntu/armshop-backup/backup-db.js
cd /home/ubuntu/backups/db
for f in shop-*.sqlite; do
  [ -e "$f" ] || continue
  gzip -q -f "$f"
done
find /home/ubuntu/backups/db -name 'shop-*.sqlite.gz' -mmin +2880 -delete
echo "backup-db OK: $(ls /home/ubuntu/backups/db/shop-*.sqlite.gz 2>/dev/null | wc -l) snapshot tersimpan"
