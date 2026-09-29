#!/usr/bin/env python3
"""OWN A CAR operations. Standard library only. Every command reads own-a-car/config.json.

Money (needs STRIPE_SECRET_KEY; use a test-mode key first):
  setup-stripe            Create the product, price, shipping rates and US + international Payment Links,
                          then write their IDs and URLs into config.json.
  sync                    Pull paid orders into data/registry.json (public, no personal data) and
                          close the Payment Links automatically once presaleCloses has passed.
  refund [--execute]      Refund every order (the all-or-nothing miss). Dry run without --execute.
  close                   Deactivate the Payment Links now.

Fulfilment (writes personal data to ops/private/, which git ignores):
  export                  orders.csv: key numbers, name, email, shipping address.
  labels                  Pirate Ship bulk-import CSV, one row per order.
  certificates            certificates.html: one printable ownership certificate per key.
  emails TEMPLATE         Mail-merge CSV for marketing/email/TEMPLATE.md (email, name, keys, tracking link).

Tracking (edits data/status.json, which buyers see on their key page):
  phase PHASE             soon | presale | funded | refunding | car | casting | shipping | done
  mark STATUS RANGES      e.g. `mark shipped 1-500 742`. STATUS: packed | shipped | delivered | clear
  hide KEY                Remove an owner's name from the public wall (moderation).

Tests: STRIPE_FIXTURE=path/to/sessions.json swaps the Stripe API for a local file (see test_ops.py).
"""
import base64
import csv
import hashlib
import html
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config.json"
REGISTRY = ROOT / "data" / "registry.json"
STATUS = ROOT / "data" / "status.json"
PRIVATE = ROOT / "ops" / "private"
API = "https://api.stripe.com/v1"
PHASES = ["soon", "presale", "funded", "refunding", "car", "casting", "shipping", "done"]
ORDER_STATUSES = ["packed", "shipped", "delivered"]


def load(path):
    return json.loads(path.read_text())


def save(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


cfg = load(CONFIG)


# ---------- Stripe ----------

def stripe(method, path, params=None):
    fixture = os.environ.get("STRIPE_FIXTURE")
    if fixture:
        return fake_stripe(fixture, method, path, params or {})
    key = os.environ.get("STRIPE_SECRET_KEY")
    if not key:
        sys.exit("Set STRIPE_SECRET_KEY (a restricted key is best; see OPERATIONS.md).")
    data = urllib.parse.urlencode(params or {}, doseq=True)
    url = f"{API}{path}" + (f"?{data}" if method == "GET" and data else "")
    req = urllib.request.Request(url, method=method, data=data.encode() if method == "POST" else None)
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{key}:".encode()).decode())
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = json.load(e)
        raise StripeError(body.get("error", {}).get("code"), body) from None


class StripeError(Exception):
    def __init__(self, code, body):
        super().__init__(f"{code}: {body}")
        self.code = code


def fake_stripe(fixture, method, path, params):
    """Tiny stand-in for the endpoints this script uses, backed by a JSON file."""
    db = load(Path(fixture))
    if method == "GET" and path == "/checkout/sessions":
        rows = [s for s in db["sessions"] if s["payment_link"] == params["payment_link"]]
        return {"data": rows, "has_more": False}
    if method == "POST" and path == "/refunds":
        db.setdefault("refunds", []).append(params["payment_intent"])
        save(Path(fixture), db)
        return {"id": "re_fake"}
    if method == "POST" and path.startswith("/payment_links/"):
        db.setdefault("closed", []).append(path.split("/")[-1])
        save(Path(fixture), db)
        return {"active": False}
    raise NotImplementedError(f"{method} {path}")


def links():
    return [(region, v["paymentLinkId"]) for region, v in cfg["stripe"].items() if v["paymentLinkId"]]


def paid_sessions():
    """Every completed, paid checkout on either Payment Link, oldest first."""
    out = []
    for region, link in links():
        params = {"payment_link": link, "status": "complete", "limit": 100,
                  "expand[]": ["data.line_items", "data.payment_intent.latest_charge"]}
        while True:
            page = stripe("GET", "/checkout/sessions", params)
            for s in page["data"]:
                if s["payment_status"] == "paid":
                    s["_region"] = region
                    out.append(s)
            if not page["has_more"]:
                break
            params["starting_after"] = page["data"][-1]["id"]
    return sorted(out, key=lambda s: (s["created"], s["id"]))


def order_hash(session_id):
    # Public stand-in for the checkout session ID. The buyer's tracking link carries the real ID,
    # and their browser hashes it to find their row, so no personal data is ever published.
    return hashlib.sha256(session_id.encode()).hexdigest()[:20]


def quantity(s):
    return sum(item["quantity"] for item in s["line_items"]["data"])


def refunded(s):
    charge = (s.get("payment_intent") or {}).get("latest_charge") or {}
    return bool(charge.get("refunded"))


def registry_name(s):
    for f in s.get("custom_fields") or []:
        if f.get("key") == "registry_name":
            value = ((f.get("text") or {}).get("value") or "").strip()
            return " ".join(value.split())[:32]
    return ""


def shipping(s):
    # Newer API versions nest shipping under collected_information.
    d = (s.get("collected_information") or {}).get("shipping_details") or s.get("shipping_details") or {}
    return d.get("name") or "", d.get("address") or {}


# ---------- commands: money ----------

def cmd_setup_stripe():
    if any(v["paymentLinkId"] for v in cfg["stripe"].values()):
        sys.exit("config.json already has Payment Links. Clear them first if you really want new ones.")
    product = stripe("POST", "/products", {
        "name": "OWN A CAR · Key",
        "description": "One numbered brass key, box and certificate from the OWN A CAR art project. Symbolic ownership; no legal title.",
        "tax_code": "txcd_99999999",  # general tangible goods
    })
    price = stripe("POST", "/prices", {"product": product["id"], "unit_amount": cfg["priceUsd"] * 100, "currency": "usd"})
    redirect = cfg["siteUrl"] + "key.html?o={CHECKOUT_SESSION_ID}"
    for region, ship_usd, countries in [("us", 0, ["US"]), ("intl", cfg["intlShippingUsd"], INTL_COUNTRIES)]:
        rate = stripe("POST", "/shipping_rates", {
            "display_name": "Free shipping" if ship_usd == 0 else "International shipping",
            "type": "fixed_amount", "fixed_amount[amount]": ship_usd * 100, "fixed_amount[currency]": "usd",
        })
        link = stripe("POST", "/payment_links", {
            "line_items[0][price]": price["id"],
            "line_items[0][quantity]": 1,
            "line_items[0][adjustable_quantity][enabled]": "true",
            "line_items[0][adjustable_quantity][minimum]": 1,
            "line_items[0][adjustable_quantity][maximum]": cfg["maxKeysPerOrder"],
            "shipping_address_collection[allowed_countries][]": countries,
            "shipping_options[0][shipping_rate]": rate["id"],
            "custom_fields[0][key]": "registry_name",
            "custom_fields[0][label][type]": "custom",
            "custom_fields[0][label][custom]": "Name for the public owners' wall (optional)",
            "custom_fields[0][type]": "text",
            "custom_fields[0][optional]": "true",
            "custom_fields[0][text][maximum_length]": 32,
            "automatic_tax[enabled]": "true",
            "consent_collection[terms_of_service]": "required",
            "after_completion[type]": "redirect",
            "after_completion[redirect][url]": redirect,
            "metadata[project]": "own-a-car",
            "metadata[region]": region,
        })
        cfg["stripe"][region] = {"paymentLinkId": link["id"], "url": link["url"]}
        print(f"{region}: {link['url']}")
    save(CONFIG, cfg)
    print("Saved to config.json. Commit it to switch the Buy buttons on.")


# Stripe's shipping-country list minus the US and places cards/customs make painful.
INTL_COUNTRIES = ["CA", "GB", "IE", "AU", "NZ", "DE", "FR", "NL", "BE", "LU", "AT", "CH", "ES", "PT", "IT",
                  "DK", "SE", "NO", "FI", "IS", "PL", "CZ", "EE", "LV", "LT", "JP", "KR", "SG", "HK", "TW",
                  "AE", "IL", "MX", "BR"]


def cmd_sync():
    reg = load(REGISTRY)
    known = {o["h"]: o for o in reg["orders"]}
    next_key = max((o["to"] for o in reg["orders"]), default=0) + 1
    hidden = set(load(STATUS).get("hidden", []))
    for s in paid_sessions():
        h = order_hash(s["id"])
        o = known.get(h)
        if o is None:
            q = quantity(s)
            o = {"h": h, "from": next_key, "to": next_key + q - 1,
                 "at": datetime.fromtimestamp(s["created"], timezone.utc).strftime("%Y-%m-%d"),
                 "region": s["_region"]}
            next_key += q
            reg["orders"].append(o)
            known[h] = o
        o["name"] = "" if h in hidden else registry_name(s)
        o["refunded"] = refunded(s)
    reg["keys"] = sum(o["to"] - o["from"] + 1 for o in reg["orders"] if not o.get("refunded"))
    reg["owners"] = sum(1 for o in reg["orders"] if not o.get("refunded"))
    reg["updated"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    save(REGISTRY, reg)
    print(f"{reg['keys']} keys across {reg['owners']} orders")
    if datetime.now(timezone.utc) > datetime.fromisoformat(cfg["presaleCloses"]):
        cmd_close(quiet=True)


def cmd_close(quiet=False):
    for region, link in links():
        stripe("POST", f"/payment_links/{link}", {"active": "false"})
        if not quiet:
            print(f"closed {region} ({link})")


def cmd_refund(execute):
    total = 0
    for s in paid_sessions():
        if refunded(s):
            continue
        pi = s["payment_intent"]["id"] if isinstance(s["payment_intent"], dict) else s["payment_intent"]
        email = (s.get("customer_details") or {}).get("email")
        total += s["amount_total"]
        if not execute:
            print(f"would refund {pi}  {email}  ${s['amount_total'] / 100:.2f}")
            continue
        try:
            stripe("POST", "/refunds", {"payment_intent": pi, "metadata[reason]": "own-a-car goal not reached"})
            print(f"refunded {pi}  {email}")
        except StripeError as e:
            print(("already refunded " if e.code == "charge_already_refunded" else "FAILED ") + f"{pi}: {e}",
                  file=sys.stderr)
    print(f"{'refunded' if execute else 'would refund'} ${total / 100:,.2f} (includes shipping and tax)")


# ---------- commands: fulfilment ----------

def private_orders():
    """Join Stripe's personal data to the registry's key numbers. Never written anywhere public."""
    reg = {o["h"]: o for o in load(REGISTRY)["orders"]}
    rows = []
    for s in paid_sessions():
        o = reg.get(order_hash(s["id"]))
        if not o or o.get("refunded"):
            continue
        name, addr = shipping(s)
        cust = s.get("customer_details") or {}
        rows.append({
            "keys": f"{o['from']}-{o['to']}" if o["to"] > o["from"] else str(o["from"]),
            "from": o["from"], "to": o["to"], "qty": o["to"] - o["from"] + 1,
            "registry_name": o.get("name", ""),
            "name": name or cust.get("name") or "", "email": cust.get("email") or "",
            "line1": addr.get("line1") or "", "line2": addr.get("line2") or "", "city": addr.get("city") or "",
            "state": addr.get("state") or "", "postal_code": addr.get("postal_code") or "",
            "country": addr.get("country") or "",
            "tracking_link": cfg["siteUrl"] + "key.html?o=" + s["id"],
        })
    return sorted(rows, key=lambda r: r["from"])


def write_csv(name, rows, fields):
    PRIVATE.mkdir(parents=True, exist_ok=True)
    path = PRIVATE / name
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"{len(rows)} rows → {path.relative_to(ROOT)}")


def cmd_export():
    write_csv("orders.csv", private_orders(),
              ["keys", "qty", "name", "email", "line1", "line2", "city", "state", "postal_code", "country",
               "registry_name", "tracking_link"])


def cmd_labels():
    # Column names Pirate Ship's spreadsheet import auto-detects. Weight: key + rigid box + mailer ≈ 12 oz
    # for one key; add 5 oz per extra key. Re-weigh the real sample before the first batch.
    rows = [{"Name": r["name"], "Address": r["line1"], "Address Line 2": r["line2"], "City": r["city"],
             "State": r["state"], "Zipcode": r["postal_code"], "Country": r["country"], "Email": r["email"],
             "Pounds": 0, "Ounces": 12 + 5 * (r["qty"] - 1), "Order ID": "KEY " + r["keys"]}
            for r in private_orders()]
    write_csv("pirateship.csv", rows, list(rows[0]) if rows else ["Name"])


def cmd_certificates():
    template = (ROOT / "packaging" / "certificate.html").read_text().replace("../fonts/", "../../fonts/")
    head, body = template.split("<!--CERT-->")[0], template.split("<!--CERT-->")[1]
    body, tail = body.split("<!--/CERT-->")
    pages = []
    for r in private_orders():
        for n in range(r["from"], r["to"] + 1):
            pages.append(body.replace("{{NAME}}", html.escape(r["registry_name"] or r["name"]))
                             .replace("{{KEY}}", f"{n:04d}")
                             .replace("{{DATE}}", datetime.now().strftime("%B %Y")))
    PRIVATE.mkdir(parents=True, exist_ok=True)
    out = PRIVATE / "certificates.html"
    out.write_text(head + "".join(pages) + tail)
    print(f"{len(pages)} certificates → {out.relative_to(ROOT)} (open in Chrome, print to PDF, no margins)")


def cmd_emails(template):
    if not (ROOT / "marketing" / "email" / f"{template}.md").exists():
        sys.exit(f"No marketing/email/{template}.md")
    rows = [{**r, "first_name": (r["name"].split() or [""])[0]} for r in private_orders()]
    write_csv(f"email-{template}.csv", rows, ["email", "first_name", "keys", "qty", "tracking_link"])


# ---------- commands: tracking ----------

def parse_ranges(args):
    keys = set()
    for a in args:
        lo, _, hi = a.partition("-")
        keys.update(range(int(lo), int(hi or lo) + 1))
    return keys


def cmd_phase(phase):
    if phase not in PHASES:
        sys.exit(f"phase must be one of {', '.join(PHASES)}")
    st = load(STATUS)
    st["phase"] = phase
    save(STATUS, st)
    print(f"phase = {phase}")


def cmd_mark(status, ranges):
    if status not in ORDER_STATUSES + ["clear"]:
        sys.exit(f"status must be one of {', '.join(ORDER_STATUSES)} or clear")
    keys = parse_ranges(ranges)
    st = load(STATUS)
    changed = 0
    for o in load(REGISTRY)["orders"]:
        if keys & set(range(o["from"], o["to"] + 1)):
            if status == "clear":
                st["orders"].pop(o["h"], None)
            else:
                st["orders"][o["h"]] = status
            changed += 1
    save(STATUS, st)
    print(f"{changed} orders → {status}")


def cmd_hide(key):
    n = int(key)
    st = load(STATUS)
    reg = load(REGISTRY)
    for o in reg["orders"]:
        if o["from"] <= n <= o["to"]:
            st.setdefault("hidden", []).append(o["h"])
            o["name"] = ""
    save(STATUS, st)
    save(REGISTRY, reg)
    print(f"hid the name on key {n}")


def main(argv):
    cmd, args = (argv[0], argv[1:]) if argv else ("", [])
    commands = {
        "setup-stripe": lambda: cmd_setup_stripe(),
        "sync": lambda: cmd_sync(),
        "close": lambda: cmd_close(),
        "refund": lambda: cmd_refund("--execute" in args),
        "export": lambda: cmd_export(),
        "labels": lambda: cmd_labels(),
        "certificates": lambda: cmd_certificates(),
        "emails": lambda: cmd_emails(args[0]),
        "phase": lambda: cmd_phase(args[0]),
        "mark": lambda: cmd_mark(args[0], args[1:]),
        "hide": lambda: cmd_hide(args[0]),
    }
    if cmd not in commands:
        sys.exit(__doc__)
    commands[cmd]()


if __name__ == "__main__":
    main(sys.argv[1:])
