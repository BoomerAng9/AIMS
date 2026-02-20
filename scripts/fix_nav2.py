#!/usr/bin/env python3
"""Fix LANDING_NAV in SiteHeader.tsx - replace broken arena/sandbox lines"""
import re

path = "/root/aims/frontend/components/SiteHeader.tsx"
with open(path, "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    stripped = line.strip()
    if "href:  /arena" in stripped or "href: /arena" in stripped:
        new_lines.append('  { href: "/arena", label: "The Arena" },\n')
    elif "href: /sandbox" in stripped and "label: Sandbox" in stripped:
        new_lines.append('  { href: "/sandbox", label: "Sandbox" },\n')
    else:
        new_lines.append(line)

with open(path, "w") as f:
    f.writelines(new_lines)

# Verify
with open(path, "r") as f:
    content = f.read()

if '"/arena"' in content and '"/sandbox"' in content:
    print("SUCCESS")
else:
    print("FAIL")
