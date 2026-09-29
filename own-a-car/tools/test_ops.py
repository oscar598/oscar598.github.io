#!/usr/bin/env python3
"""End-to-end test of ops.py against a fake Stripe. Runs in a temp copy, so the real data/ is untouched.

  python3 own-a-car/tools/test_ops.py
"""
import csv
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent


def session(i, link, qty, created, name="", refunded=False, country="US"):
    return {
        "id": f"cs_test_{i}", "payment_link": link, "payment_status": "paid", "created": created,
        "amount_total": 5000 * qty, "payment_intent": {"id": f"pi_{i}", "latest_charge": {"refunded": refunded}},
        "line_items": {"data": [{"quantity": qty}]},
        "custom_fields": [{"key": "registry_name", "text": {"value": name}}],
        "customer_details": {"email": f"buyer{i}@example.com", "name": f"Buyer {i}"},
        "collected_information": {"shipping_details": {"name": f"Buyer {i}", "address": {
            "line1": f"{i} Main St", "line2": None, "city": "Princeton", "state": "NJ",
            "postal_code": "08544", "country": country}}},
    }


def run(root, fixture, *args):
    env = {**os.environ, "STRIPE_FIXTURE": str(fixture)}
    r = subprocess.run([sys.executable, str(root / "tools" / "ops.py"), *args], env=env, capture_output=True, text=True)
    if r.returncode:
        raise AssertionError(f"ops.py {' '.join(args)} failed:\n{r.stdout}{r.stderr}")
    return r.stdout


def main():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp) / "own-a-car"
        shutil.copytree(SRC, root, ignore=shutil.ignore_patterns("assets", "ops", "__pycache__"))
        cfg = json.loads((root / "config.json").read_text())
        cfg["stripe"] = {"us": {"paymentLinkId": "plink_us", "url": ""}, "intl": {"paymentLinkId": "plink_intl", "url": ""}}
        cfg["presaleCloses"] = "2099-01-01T00:00:00-05:00"
        (root / "config.json").write_text(json.dumps(cfg))
        (root / "data" / "registry.json").write_text('{"updated": null, "keys": 0, "orders": []}')
        (root / "data" / "status.json").write_text('{"phase": "presale", "orders": {}}')
        fixture = Path(tmp) / "stripe.json"

        # Three buyers; the second buys three keys from abroad.
        db = {"sessions": [session(1, "plink_us", 1, 100, "Oscar L."),
                           session(2, "plink_intl", 3, 200, "  Ada   Lovelace ", country="GB"),
                           session(3, "plink_us", 1, 300)]}
        fixture.write_text(json.dumps(db))
        run(root, fixture, "sync")
        reg = json.loads((root / "data" / "registry.json").read_text())
        spans = [(o["from"], o["to"], o["name"]) for o in reg["orders"]]
        assert spans == [(1, 1, "Oscar L."), (2, 4, "Ada Lovelace"), (5, 5, "")], spans
        assert reg["keys"] == 5 and reg["owners"] == 3
        assert "buyer" not in json.dumps(reg) and "Main St" not in json.dumps(reg), "personal data leaked"

        # Buyer 1 refunds, and a new buyer arrives with an earlier-sorting ID: numbers must not shift.
        db["sessions"][0]["payment_intent"]["latest_charge"]["refunded"] = True
        db["sessions"].append(session(0, "plink_us", 2, 400, "Late"))
        fixture.write_text(json.dumps(db))
        run(root, fixture, "sync")
        reg = json.loads((root / "data" / "registry.json").read_text())
        spans = [(o["from"], o["to"], o.get("refunded")) for o in reg["orders"]]
        assert spans == [(1, 1, True), (2, 4, False), (5, 5, False), (6, 7, False)], spans
        assert reg["keys"] == 6

        # Tracking.
        run(root, fixture, "mark", "shipped", "3", "6-7")
        st = json.loads((root / "data" / "status.json").read_text())
        assert sorted(st["orders"].values()) == ["shipped", "shipped"]
        run(root, fixture, "hide", "2")
        reg = json.loads((root / "data" / "registry.json").read_text())
        assert reg["orders"][1]["name"] == ""
        run(root, fixture, "sync")  # a later sync must keep the name hidden
        assert json.loads((root / "data" / "registry.json").read_text())["orders"][1]["name"] == ""

        # Fulfilment files skip the refunded order and contain one certificate per key.
        run(root, fixture, "export")
        rows = list(csv.DictReader((root / "ops" / "private" / "orders.csv").open()))
        assert [r["keys"] for r in rows] == ["2-4", "5", "6-7"], rows
        run(root, fixture, "labels")
        labels = list(csv.DictReader((root / "ops" / "private" / "pirateship.csv").open()))
        assert labels[0]["Ounces"] == "22" and labels[0]["Country"] == "GB"
        run(root, fixture, "certificates")
        certs = (root / "ops" / "private" / "certificates.html").read_text()
        assert certs.count('class="cert"') == 6 and "0007" in certs and "{{" not in certs
        run(root, fixture, "emails", "shipped")

        # Refund dry run touches nothing; --execute refunds only the unrefunded orders.
        run(root, fixture, "refund")
        assert "refunds" not in json.loads(fixture.read_text())
        run(root, fixture, "refund", "--execute")
        assert sorted(json.loads(fixture.read_text())["refunds"]) == ["pi_0", "pi_2", "pi_3"]

        # Past the deadline, sync closes both links.
        cfg["presaleCloses"] = "2000-01-01T00:00:00-05:00"
        (root / "config.json").write_text(json.dumps(cfg))
        run(root, fixture, "sync")
        assert sorted(json.loads(fixture.read_text())["closed"]) == ["plink_intl", "plink_us"]
    print("ops.py: all checks passed")


if __name__ == "__main__":
    main()
