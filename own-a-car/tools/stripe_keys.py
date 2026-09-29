#!/usr/bin/env python3
"""Stripe automation for Own a Car. Standard library only.

  STRIPE_SECRET_KEY=rk_live_... PAYMENT_LINK_ID=plink_... python3 stripe_keys.py count
      Writes own-a-car/progress.json with the number of paid keys (drives the page's meter).

  ... python3 stripe_keys.py refund            # dry run: lists what would be refunded
  ... python3 stripe_keys.py refund --execute  # refunds every paid key in full

Use a restricted key: Checkout Sessions read, plus Refunds write only for the refund command.
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = "https://api.stripe.com/v1"
KEY = os.environ["STRIPE_SECRET_KEY"]
LINK = os.environ["PAYMENT_LINK_ID"]
PROGRESS = Path(__file__).resolve().parent.parent / "progress.json"


def stripe(method, path, params=None):
    data = urllib.parse.urlencode(params or {}, doseq=True)
    url = f"{API}{path}" + (f"?{data}" if method == "GET" and data else "")
    req = urllib.request.Request(url, method=method, data=data.encode() if method == "POST" else None)
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{KEY}:".encode()).decode())
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def paid_sessions():
    params = {"payment_link": LINK, "status": "complete", "limit": 100, "expand[]": "data.line_items"}
    while True:
        page = stripe("GET", "/checkout/sessions", params)
        for s in page["data"]:
            if s["payment_status"] == "paid":
                yield s
        if not page["has_more"]:
            return
        params["starting_after"] = page["data"][-1]["id"]


def keys_in(session):
    return sum(item["quantity"] for item in session["line_items"]["data"])


def count():
    keys = sum(keys_in(s) for s in paid_sessions())
    PROGRESS.write_text(json.dumps({"keys": keys, "updated": datetime.now(timezone.utc).isoformat(timespec="seconds")}) + "\n")
    print(f"{keys} keys")


def refund(execute):
    total = 0
    for s in paid_sessions():
        pi = s["payment_intent"]
        email = (s.get("customer_details") or {}).get("email")
        total += s["amount_total"]
        if not execute:
            print(f"would refund {pi}  {email}  ${s['amount_total'] / 100:.2f}")
            continue
        try:
            # Safe to re-run: an already-refunded payment errors with charge_already_refunded below.
            stripe("POST", "/refunds", {"payment_intent": pi, "metadata[reason]": "own-a-car goal not reached"})
            print(f"refunded {pi}  {email}")
        except urllib.error.HTTPError as e:
            body = json.load(e)
            code = body.get("error", {}).get("code")
            if code == "charge_already_refunded":
                print(f"already refunded {pi}")
            else:
                print(f"FAILED {pi}: {body}", file=sys.stderr)
    print(f"{'refunded' if execute else 'would refund'} ${total / 100:,.2f} total")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "count":
        count()
    elif cmd == "refund":
        refund("--execute" in sys.argv)
    else:
        sys.exit(__doc__)
