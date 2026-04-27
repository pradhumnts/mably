#!/usr/bin/env python3
"""Send a one-off test email via Resend (no npm). Run from repo root:
   python3 scripts/send-resend-test.py
   python3 scripts/send-resend-test.py other@email.com

   If RESEND_FROM uses onboarding@resend.dev, Resend only delivers to the email
   you use to log into resend.com until you verify a domain and change RESEND_FROM.
"""
import json
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV = ROOT / ".env.local"


def parse_env(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        key = k.strip()
        v = v.strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        out[key] = v
    return out


def main() -> None:
    extra = [a for a in sys.argv[1:] if not a.startswith("-")]
    recipients = extra if extra else ["hello@prad.dev", "pradhumnts@gmail.com"]

    if not ENV.is_file():
        print(f"Missing {ENV}", file=sys.stderr)
        sys.exit(1)

    env = parse_env(ENV.read_text(encoding="utf-8"))
    api_key = env.get("RESEND_API_KEY", "").strip()
    from_addr = env.get("RESEND_FROM", "").strip()
    if not api_key or not from_addr:
        print("RESEND_API_KEY or RESEND_FROM missing in .env.local", file=sys.stderr)
        sys.exit(1)

    payload = {
        "from": from_addr,
        "to": recipients,
        "subject": "Mably — Resend test (local script)",
        "html": "<p>If you see this, Resend + .env.local work on your machine.</p>",
    }

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            print("HTTP", resp.status)
            print(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.reason, file=sys.stderr)
        print(e.read().decode("utf-8", errors="replace"), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
