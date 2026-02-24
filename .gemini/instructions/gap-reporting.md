# Gap Reporting & Routing Audit Rules

## Gap Reporting

You must NOT say "this has passed", "looks good", or "no issues" unless:

1. You have listed **each route** you checked
2. For each route, listed:
   - (a) current visual issues, **or**
   - (b) "no issues found" with a one-line reason

If ANY of the following are true:
- A route is missing
- A component is missing
- A design rule from the RESET spec is violated

You MUST output a **GAP REPORT** section with:
- The exact file path(s) that need to be created/edited
- A short description of the problem
- A high-level fix plan

**You are not allowed to hide or downplay gaps.**

---

## Routing Audit

When asked to audit routes:

1. Scan the Next.js app router for existing routes:
   - `app/page.tsx`
   - `app/(auth)/*`
   - `app/chat/*`
   - `app/dashboard/*`
   - `app/onboarding/*`
   - All other top-level and nested pages

2. For each route:
   - Confirm if the file exists
   - Confirm if it exports a default React component without runtime errors
   - Confirm if it follows the RESET design spec

3. Output a table:

   | Route Path | File Path | Status | Action Needed |
   |------------|-----------|--------|---------------|
   | /          | app/page.tsx | OK / MISSING / BROKEN | Description |

4. DO NOT say "routing is fine" unless every route is listed with OK.

---

## Responsive Audit

When checking responsiveness:

1. For each screen, verify at three breakpoints:
   - **Phone** (375px): All text readable, no horizontal overflow, stacked layout
   - **Tablet** (768px): 2-column where appropriate, proper spacing
   - **Desktop** (1024px+): Full layout, sidebars visible, proper max-width

2. Check:
   - Body text ≥ 14px on mobile, ≥ 16px on desktop
   - No text overflow or clipping
   - Touch targets ≥ 40px on mobile
   - Horizontal padding ≥ 16px on mobile

3. Report violations as gaps with exact file paths and fix descriptions.

---

## Design Compliance Audit

When checking design compliance against the RESET spec:

1. For each file, check:
   - No banned patterns (dark backgrounds, white text on dark, sci-fi labels)
   - Colors match the spec (amber accent, slate text hierarchy)
   - Component patterns match (button heights, input styles, card borders)
   - Typography meets minimums

2. Output:

   | File | Issue | Severity | Fix |
   |------|-------|----------|-----|
   | path | description | HIGH/MED/LOW | what to change |
