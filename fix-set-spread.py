#!/usr/bin/env python3
import sys
f = '/root/aims/frontend/app/sandbox/perform/big-board/page.tsx'
with open(f) as fh:
    c = fh.read()
old = "['ALL', ...new Set(prospects.map(p => p.position))]"
new = "['ALL', ...Array.from(new Set(prospects.map(p => p.position)))]"
c = c.replace(old, new)
with open(f, 'w') as fh:
    fh.write(c)
print('Fixed big-board/page.tsx')
