#!/usr/bin/env python3
"""OWN A CAR · X auto-poster. Reads marketing/x/queue.json and posts whatever is due.

  python3 own-a-car/tools/xpost.py list                 # every queued post, its status and when it's due
  python3 own-a-car/tools/xpost.py due                  # dry run: what would post right now (nothing is sent)
  python3 own-a-car/tools/xpost.py post --live          # post everything due, then mark it posted
  python3 own-a-car/tools/xpost.py post --live --id L1  # post one entry now, due or not
  python3 own-a-car/tools/xpost.py check                # lint the queue: lengths, media files, banned words, threads

Credentials (one set per account, from developer.x.com → your app → "Keys and tokens", with Read and Write
permission; OAuth 1.0a user context). Env vars, where ACCOUNT is the queue's account name upper-cased:
  X_<ACCOUNT>_API_KEY  X_<ACCOUNT>_API_SECRET  X_<ACCOUNT>_ACCESS_TOKEN  X_<ACCOUNT>_ACCESS_SECRET
e.g. X_OWNACAR_API_KEY … and X_OSCAR_API_KEY … Standard library only.

Queue entry (marketing/x/queue.json → "posts"):
  { "id": "L1", "account": "oscar", "at": "2026-11-09T12:00:00-05:00", "text": "...",
    "media": ["own-a-car/marketing/x/clips/launch-16x9.mp4"], "reply_to": "L0" | null, "quote": "L0" | null,
    "status": "draft" | "approved" | "posted", "posted_id": null, "note": "..." }
Only "approved" entries ever post. Replies/quotes of another entry wait until that entry has posted.
Text may use {keys}, {owners}, {grams}, {thing}, {goal}, {days_left}, {link}: filled from the live registry.
"""
import base64
import hashlib
import hmac
import json
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ROOT = REPO / "own-a-car"
QUEUE = ROOT / "marketing" / "x" / "queue.json"
API = "https://api.x.com"
UPLOAD = "https://api.x.com/2/media/upload"
BANNED = re.compile(r"\b(invest(ment|ing|or)?|returns?|profits?|stake|shares? in|dividend|appreciat\w*|to the moon|"
                    r"win(ner|s)?|lucky|raffle|giveaway|sweepstakes?)\b", re.I)


# ---------- queue ----------

def load():
    return json.loads(QUEUE.read_text())


def save(q):
    QUEUE.write_text(json.dumps(q, indent=2, ensure_ascii=False) + "\n")


def live_values():
    cfg = json.loads((ROOT / "config.json").read_text())
    reg = json.loads((ROOT / "data" / "registry.json").read_text())
    keys = reg.get("keys", 0)
    g = cfg["car"]["weightKg"] * 1000 / max(1, keys)
    closes = datetime.fromisoformat(cfg["presaleCloses"])
    days = max(0, (closes - datetime.now(timezone.utc)).days)
    grams = f"{g / 1000:,.1f} kg" if g >= 1000 else f"{g:,.0f} g"
    return {"keys": f"{keys:,}", "owners": f"{reg.get('owners', 0):,}", "grams": grams, "thing": thing(g),
            "goal": f"{cfg['goalKeys']:,}", "days_left": str(days), "link": cfg["siteUrl"]}


def thing(g):
    for lim, name in [(60000, "a whole person"), (20000, "a wheel and tire"), (7000, "a bowling ball"), (2500, "a brick"),
                      (1000, "a liter of water"), (400, "a football"), (330, "a can of soda"), (170, "a phone"),
                      (57, "a tennis ball"), (30, "a lug nut"), (10, "a car key"), (1, "a paperclip")]:
        if g >= lim:
            return name
    return "a grain of rice"


def render(text):
    vals = live_values()
    return re.sub(r"\{(\w+)\}", lambda m: vals.get(m[1], m[0]), text)


def weighted_len(text):
    # X counts URLs as 23 and most CJK/emoji as 2; plain Latin text counts 1 per character.
    text = re.sub(r"https?://\S+", "x" * 23, text)
    return sum(2 if ord(c) > 0x10FF else 1 for c in text)


def due(q, now=None):
    now = now or datetime.now(timezone.utc)
    posted = {p["id"] for p in q["posts"] if p["status"] == "posted"}
    out = []
    for p in q["posts"]:
        if p["status"] != "approved" or datetime.fromisoformat(p["at"]) > now:
            continue
        parent = p.get("reply_to") or p.get("quote")
        if parent and parent not in posted:
            continue
        out.append(p)
    return sorted(out, key=lambda p: p["at"])


# ---------- X API (OAuth 1.0a user context) ----------

def creds(account):
    pre = f"X_{account.upper()}_"
    try:
        return {k: os.environ[pre + k] for k in ("API_KEY", "API_SECRET", "ACCESS_TOKEN", "ACCESS_SECRET")}
    except KeyError as e:
        sys.exit(f"missing credential {e.args[0]} for account '{account}'")


def oauth_header(method, url, c, params=None):
    oauth = {"oauth_consumer_key": c["API_KEY"], "oauth_nonce": uuid.uuid4().hex, "oauth_signature_method": "HMAC-SHA1",
             "oauth_timestamp": str(int(time.time())), "oauth_token": c["ACCESS_TOKEN"], "oauth_version": "1.0"}
    allp = {**oauth, **(params or {})}
    enc = lambda s: urllib.parse.quote(str(s), safe="~")
    base = "&".join([method, enc(url), enc("&".join(f"{enc(k)}={enc(allp[k])}" for k in sorted(allp)))])
    key = f"{enc(c['API_SECRET'])}&{enc(c['ACCESS_SECRET'])}"
    oauth["oauth_signature"] = base64.b64encode(hmac.new(key.encode(), base.encode(), hashlib.sha1).digest()).decode()
    return "OAuth " + ", ".join(f'{enc(k)}="{enc(v)}"' for k, v in sorted(oauth.items()))


def call(method, url, c, json_body=None, form=None, body=None, ctype=None):
    headers = {"Authorization": oauth_header(method, url, c, form)}
    data = None
    if json_body is not None:
        data, headers["Content-Type"] = json.dumps(json_body).encode(), "application/json"
    elif form is not None:
        data, headers["Content-Type"] = urllib.parse.urlencode(form).encode(), "application/x-www-form-urlencoded"
    elif body is not None:
        data, headers["Content-Type"] = body, ctype
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"X API {e.code} on {url}: {e.read().decode(errors='replace')}")


def upload(path, c):
    """Chunked media upload on X's v2 endpoints (initialize → append → finalize → poll status).
    Written against the 2025 v2 media API; not yet run against a live account, so check the first
    real post and X's current docs (docs.x.com → Media) if a step errors."""
    data = Path(path).read_bytes()
    mime = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    cat = "tweet_video" if mime.startswith("video") else "tweet_gif" if mime == "image/gif" else "tweet_image"
    init = call("POST", f"{UPLOAD}/initialize", c,
                json_body={"media_type": mime, "total_bytes": len(data), "media_category": cat})
    mid = init["data"]["id"]
    step = 4 * 1024 * 1024
    for i in range(0, len(data), step):
        boundary = uuid.uuid4().hex
        head = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"segment_index\"\r\n\r\n{i // step}\r\n"
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"media\"; filename=\"blob\"\r\n"
                f"Content-Type: application/octet-stream\r\n\r\n")
        body = head.encode() + data[i:i + step] + f"\r\n--{boundary}--\r\n".encode()
        call("POST", f"{UPLOAD}/{mid}/append", c, body=body, ctype=f"multipart/form-data; boundary={boundary}")
    fin = call("POST", f"{UPLOAD}/{mid}/finalize", c, json_body={})
    info = fin.get("data", {}).get("processing_info")
    while info and info.get("state") in ("pending", "in_progress"):
        time.sleep(info.get("check_after_secs", 3))
        st = call("GET", f"{UPLOAD}?command=STATUS&media_id={mid}", c)
        info = st.get("data", {}).get("processing_info")
    if info and info.get("state") == "failed":
        sys.exit(f"media processing failed for {path}: {info}")
    return mid


def post_one(p, q):
    c = creds(p["account"])
    ids = {x["id"]: x.get("posted_id") for x in q["posts"]}
    parent = p.get("reply_to") or p.get("quote")
    if parent and not ids.get(parent):
        sys.exit(f"{p['id']} replies to or quotes {parent}, which hasn't posted yet.")
    body = {"text": render(p["text"])}
    media = [upload(REPO / m, c) for m in p.get("media") or []]
    if media:
        body["media"] = {"media_ids": media}
    if p.get("reply_to"):
        body["reply"] = {"in_reply_to_tweet_id": ids[p["reply_to"]]}
    if p.get("quote"):
        body["quote_tweet_id"] = ids[p["quote"]]
    res = call("POST", f"{API}/2/tweets", c, json_body=body)
    p["status"], p["posted_id"] = "posted", res["data"]["id"]
    p["posted_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    save(q)
    print(f"posted {p['id']} → https://x.com/i/status/{p['posted_id']}")


# ---------- commands ----------

def check(q):
    problems = 0
    ids = {p["id"] for p in q["posts"]}
    for p in q["posts"]:
        text = render(p["text"])
        issues = []
        if weighted_len(text) > (q.get("limits", {}).get(p["account"], 280)):
            issues.append(f"{weighted_len(text)} chars")
        for m in p.get("media") or []:
            if not (REPO / m).exists():
                issues.append(f"missing media {m}")
        if len(p.get("media") or []) > 4:
            issues.append("more than 4 media")
        if BANNED.search(text):
            issues.append(f"banned word: {BANNED.search(text)[0]}")
        for k in ("reply_to", "quote"):
            if p.get(k) and p[k] not in ids:
                issues.append(f"{k} {p[k]} not in queue")
        if issues:
            problems += 1
            print(f"{p['id']:>5}  {'; '.join(issues)}")
    print(f"{len(q['posts'])} posts, {problems} with problems")
    return problems


def main(argv):
    cmd = argv[0] if argv else "list"
    q = load()
    if cmd == "list":
        for p in sorted(q["posts"], key=lambda p: p["at"]):
            print(f"{p['id']:>5}  {p['status']:<8}  {p['at'][:16]}  @{p['account']:<8}  {render(p['text'])[:70]!r}")
    elif cmd == "due":
        for p in due(q):
            print(f"would post {p['id']} (@{p['account']}): {render(p['text'])!r}")
    elif cmd == "check":
        sys.exit(1 if check(q) else 0)
    elif cmd == "post":
        if "--live" not in argv:
            sys.exit("Refusing without --live. Use `due` for a dry run.")
        if check(q):
            sys.exit("Fix the queue problems above first.")
        if "--id" in argv:
            want = argv[argv.index("--id") + 1]
            todo = [p for p in q["posts"] if p["id"] == want and p["status"] == "approved"]
            if not todo:
                sys.exit(f"{want} isn't in the queue with status 'approved'.")
        else:
            todo = due(q)
        for p in todo:
            post_one(p, q)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
