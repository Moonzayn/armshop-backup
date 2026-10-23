#!/bin/bash
# Pasang unit systemd untuk backup armshop (jalankan sekali).
set -e
U=/etc/systemd/system

sudo tee $U/armshop-backup-db.service > /dev/null << 'EOF'
[Unit]
Description=Armshop - backup database per jam
After=network.target

[Service]
Type=oneshot
User=ubuntu
ExecStart=/home/ubuntu/armshop-backup/backup-db.sh
EOF

sudo tee $U/armshop-backup-db.timer > /dev/null << 'EOF'
[Unit]
Description=Jalankan backup database armshop tiap jam

[Timer]
OnCalendar=hourly
Persistent=true
Unit=armshop-backup-db.service

[Install]
WantedBy=timers.target
EOF

sudo tee $U/armshop-backup-sync.service > /dev/null << 'EOF'
[Unit]
Description=Armshop - sinkron backup harian ke GitHub
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=ubuntu
ExecStart=/home/ubuntu/armshop-backup/sync-github.sh
EOF

sudo tee $U/armshop-backup-sync.timer > /dev/null << 'EOF'
[Unit]
Description=Sinkron backup armshop ke GitHub harian 03:30 WIB

[Timer]
OnCalendar=*-*-* 03:30:00 Asia/Jakarta
Persistent=true
Unit=armshop-backup-sync.service

[Install]
WantedBy=timers.target
EOF

sudo tee $U/armshop-backup-full.service > /dev/null << 'EOF'
[Unit]
Description=Armshop - snapshot penuh mingguan (lokal)
After=network.target

[Service]
Type=oneshot
User=ubuntu
ExecStart=/home/ubuntu/armshop-backup/full-backup.sh
EOF

sudo tee $U/armshop-backup-full.timer > /dev/null << 'EOF'
[Unit]
Description=Snapshot penuh armshop mingguan (Minggu 04:00 WIB)

[Timer]
OnCalendar=Sun *-*-* 04:00:00 Asia/Jakarta
Persistent=true
Unit=armshop-backup-full.service

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now armshop-backup-db.timer armshop-backup-sync.timer armshop-backup-full.timer
echo "timer terpasang:"
systemctl list-timers --all 'armshop-backup-*' --no-pager
