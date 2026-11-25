#!/usr/bin/env python3
"""Vor jedem Commit ausführen: python3 tools/stamp.py

Hängt an alle eigenen <script src="…"> in index.html eine Versionsnummer (?v=JJJJMMTT-HHMM),
damit Browser und GitHub Pages nach einem Update garantiert die neuen Dateien laden,
und schreibt die Version unten auf die Startseite (#appVer).
"""
import re, datetime, pathlib
try:
    from zoneinfo import ZoneInfo
    now = datetime.datetime.now(ZoneInfo("Europe/Berlin"))
except Exception:
    now = datetime.datetime.now()

root = pathlib.Path(__file__).resolve().parent.parent
p = root / "index.html"
s = p.read_text(encoding="utf8")
v = now.strftime("%Y%m%d-%H%M")
# eigene Skripte (keine externen URLs)
s, n = re.subn(r'<script src="(?!https?:)([^"?]+)(\?v=[^"]*)?"></script>', lambda m: f'<script src="{m.group(1)}?v={v}"></script>', s)
s, m = re.subn(r'(<p[^>]*id="appVer"[^>]*>)[^<]*(</p>)', lambda x: f'{x.group(1)}Version: {now.strftime("%d.%m.%Y %H:%M")}{x.group(2)}', s)
assert n >= 1 and m == 1, (n, m)
p.write_text(s, encoding="utf8")
print(f"Version {v}: {n} Skripte markiert")
