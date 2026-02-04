## 2025-02-04 - Missing Build Essentials
**Learning:** The repository lacked basic build configuration (linting dependencies, tsconfig paths, valid fonts). This forced a "infrastructure repair" before optimization could be verified.
**Action:** Always check `npm run build` and `npm run lint` immediately upon entry to assess the state of the repo before attempting optimizations.
