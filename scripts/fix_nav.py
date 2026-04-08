#!/usr/bin/env python3
"""Add Arena and Sandbox links to SiteHeader LANDING_NAV"""

file_path = "/root/aims/frontend/components/SiteHeader.tsx"

with open(file_path, "r") as f:
    content = f.read()

old_block = """const LANDING_NAV = [
  { href: "/", label: "Home" },
  { href: "/the-book-of-vibe", label: "Book of V.I.B.E." },
  { href: "/gallery", label: "Gallery" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];"""

new_block = """const LANDING_NAV = [
  { href: "/", label: "Home" },
  { href: "/the-book-of-vibe", label: "Book of V.I.B.E." },
  { href: "/arena", label: "The Arena" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/gallery", label: "Gallery" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(file_path, "w") as f:
        f.write(content)
    print("SUCCESS: Added Arena and Sandbox links to LANDING_NAV")
else:
    print("ERROR: Could not find LANDING_NAV block exactly")
    # Debug: show current LANDING_NAV
    import re
    match = re.search(r'const LANDING_NAV = \[.*?\];', content, re.DOTALL)
    if match:
        print("Current block:")
        print(match.group())
