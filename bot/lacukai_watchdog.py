#!/usr/bin/env python3
"""Watchdog lacukai-bot (v2, aman untuk polling).

v1 memakai getUpdates dan itu SALAH: setiap panggilan getUpdates akan
memutus long-poll bot dengan error 409, jadi alat cek justru merusak bot.
v2 memakai getWebhookInfo (bukan getUpdates) yang hanya membaca status
antrean tanpa mengganggu polling sama sekali.

Logika:
- pending_update_count == 0 -> sehat, reset hitungan.
- pending > 0 tiga cek berturut-turut (3 x 5 menit = 15 menit) -> macet -> DM admin.
- Selama masih macet, alert diulang tiap 60 menit.
- Proses PM2 tidak online -> alert juga.
Jalankan via systemd timer tiap 5 menit.
"""
import json, os, subprocess, time

BOT_DIR = os.path.expanduser("~/lacukai-bot")
STATE_FILE = os.path.join(BOT_DIR, "watchdog_state.json")
ADMIN_ID = "8815867386"
STUCK_CHECKS = 3           # 3 cek x 5 menit = 15 menit
REPEAT_EVERY = 60 * 60      # detik

def read_token():
    with open(os.path.join(BOT_DIR, ".env"), encoding="utf-8") as f:
        for line in f:
            if line.startswith("BOT_TOKEN="):
                return line.strip().split("=", 1)[1]
    return None

def api(method, **params):
    token = read_token()
    args = ["curl", "-s", "--max-time", "25",
            "https://api.telegram.org/bot%s/%s" % (token, method)]
    for k, v in params.items():
        args += ["--data-urlencode", "%s=%s" % (k, v)]
    out = subprocess.run(args, capture_output=True, text=True).stdout
    return json.loads(out) if out else {}

def load_state():
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_state(s):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(s, f)

def send_alert(text):
    r = api("sendMessage", chat_id=ADMIN_ID, text=text, parse_mode="HTML")
    return bool(r.get("ok"))

def main():
    pm = subprocess.run(["pm2", "jlist"], capture_output=True, text=True).stdout
    alive = False
    try:
        for p in json.loads(pm or "[]"):
            if p.get("name") == "lacukai-bot" and p.get("pm2_env", {}).get("status") == "online":
                alive = True
    except Exception:
        pass
    state = load_state()
    now = int(time.time())
    if not alive:
        if now - state.get("last_alert", 0) >= REPEAT_EVERY:
            send_alert("\U0001f6a8 <b>Lacukai Bot MATI</b>\nProses PM2 lacukai-bot tidak online. Cek server AWS / restart bot.")
            state["last_alert"] = now
            save_state(state)
        print("ALERT: proses mati")
        return

    # 0b) disk & web admin lokal (tidak menyentuh Telegram sama sekali)
    import shutil
    try:
        du = shutil.disk_usage("/")
        used_pct = 100 * (du.total - du.free) / du.total
        if used_pct >= 85 and now - state.get("disk_last_alert", 0) >= REPEAT_EVERY:
            send_alert("\U0001f6a8 <b>Disk server menipis</b>\nTerpakai %.0f%% — segera bersih-bersih sebelum bot/database gagal." % used_pct)
            state["disk_last_alert"] = now
            save_state(state)
    except Exception:
        pass
    try:
        code = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                               "--max-time", "10", "http://127.0.0.1:7101/"],
                              capture_output=True, text=True).stdout.strip()
        if code not in ("200", "302") and now - state.get("web_last_alert", 0) >= REPEAT_EVERY:
            send_alert("\U0001f6a8 <b>Web admin lacukai tidak menjawab</b>\nPort 7101: %s. Bot Telegram mungkin masih jalan, tapi admin web down." % (code or "?"))
            state["web_last_alert"] = now
            save_state(state)
    except Exception:
        pass

    d = api("getWebhookInfo")
    if not d.get("ok"):
        print("getWebhookInfo gagal:", d)
        return
    pending = d["result"].get("pending_update_count", 0)
    if pending == 0:
        if state.get("stuck_count"):
            state["stuck_count"] = 0
            state["stuck"] = False
            save_state(state)
        print("OK: antrean kosong")
        return
    count = state.get("stuck_count", 0) + 1
    state["stuck_count"] = count
    if count >= STUCK_CHECKS and ((not state.get("stuck")) or
                                  (now - state.get("last_alert", 0) >= REPEAT_EVERY)):
        ok = send_alert(
            "\U0001f6a8 <b>Lacukai Bot MACET</b>\n"
            "Bot tidak membaca pesan selama <b>~%d menit</b> (%d pesan tertunda).\n"
            "Segera cek server / restart lacukai-bot." % (count * 5, pending))
        state["stuck"] = True
        state["last_alert"] = now
        print("ALERT terkirim:", ok, "| pending", pending, "| cek ke-", count)
    else:
        print("antrean %d, cek ke-%d (belum alert)" % (pending, count))
    save_state(state)

if __name__ == "__main__":
    main()
