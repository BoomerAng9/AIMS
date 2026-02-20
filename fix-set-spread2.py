#!/usr/bin/env python3
f = '/root/aims/frontend/app/sandbox/perform/content/page.tsx'
with open(f) as fh:
    c = fh.read()
old = "['ALL', ...new Set(articles.map(a => a.type))]"
new = "['ALL', ...Array.from(new Set(articles.map(a => a.type)))]"
c = c.replace(old, new)
with open(f, 'w') as fh:
    fh.write(c)
print('Fixed content/page.tsx')
