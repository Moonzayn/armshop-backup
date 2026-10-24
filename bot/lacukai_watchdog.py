#!/usr/bin/env python3
"""Watchdog lacukai-bot: cek antrean update Telegram yang belum dibaca bot.

Cara kerja: getUpdates TANPA offset (read-only, tidak menghapus antrean).
- Tidak ada antrean / antrean termuda < 15 menit -> sehat, diam.
- Antrean tertua > 15 menit -> bot macet -> DM admin via curl (jalur curl
  terbukti lolos saat node fetch bermasalah) + catat state agar tidak spam.
- Antrean masih macet -> ulang alert tiap 60 menit.
- Proses PM2 tidak online -> alert juga.
Jalankan via systemd timer tiap 5 menit.
"""
import json, os, subprocess, sys, time

BOT_DIR = os.path.expanduser("~/lacukai-bot")
STATE_FILE = os.path.join(BOT_DIR, "watchdog_state.json")
ADMIN_ID = "8815867386"
STUCK_AFTER = 15 * 60      # detik
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
    # 1) proses PM2 hidup?
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

    # 2) antrean update
    d = api("getUpdates", limit=10)
    if not d.get("ok"):
        print("getUpdates gagal:", d)
        return
    ups = d.get("result", [])
    if not ups:
        if state.get("stuck"):
            state["stuck"] = False
            save_state(state)
        print("OK: antrean kosong")
        return
    oldest = min(u["message"]["date"] if "message" in u else
                 u.get("channel_post", {}).get("date", now) for u in ups)
    age_min = (now - oldest) // 60
    if now - oldest <= STUCK_AFTER:
        print("OK: antrean %d, tertua %d menit" % (len(ups), age_min))
        return
    # macet
    if (not state.get("stuck")) or (now - state.get("last_alert", 0) >= REPEAT_EVERY):
        ok = send_alert(
            "\U0001f6a8 <b>Lacukai Bot MACET</b>\n"
            "Bot tidak membaca pesan selama <b>%d menit</b> (%d pesan tertunda).\n"
            "Segera cek server / restart lacukai-bot." % (age_min, len(ups)))
        state["stuck"] = True
        state["last_alert"] = now
        save_state(state)
        print("ALERT terkirim:", ok, "| antrean", len(ups), "| tertua", age_min, "menit")
    else:
        print("masih macet, alert berikutnya nanti (antrean %d, tertua %d menit)" % (len(ups), age_min))

if __name__ == "__main__":
    main()
