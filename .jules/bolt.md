## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2026-03-24 - TypedArray reduce in 60fps loops
**Learning:** Using functional array methods like `reduce` on TypedArrays (e.g., `Uint8Array`) inside `requestAnimationFrame` loops causes unnecessary V8 overhead and garbage collection, severely impacting 60fps animation performance.
**Action:** Replace functional array methods like `reduce` with standard `for` loops when working with TypedArrays in high-frequency React animation loops.
## 2024-05-18 - [Parallelize Evidence Locker GCS network calls]
**Learning:** Sequential asynchronous network requests inside `for...of` loops are a hidden bottleneck for latency, especially when dealing with high-volume remote operations like fetching Google Cloud Storage metadata. Refactoring these loops to use `Promise.all` with `.map()` significantly cuts down total execution time by allowing concurrent requests.
**Action:** Always scan for `for...of` loops that purely execute independent `await` calls and refactor them to use `Promise.all` mapping to reduce latency.
## 2026-06-05 - Test suite failures shouldn't violate package.json constraints
**Learning:** If tests fail because dependencies like `ts-jest` or `@types/jest` are completely missing, running `npm install` to fix them will modify `package.json`, which violates Bolt's strict boundary 'Never do: Modify package.json or tsconfig.json without instruction'.
**Action:** If tests are fundamentally broken due to missing packages and you cannot update `package.json`, accept the test suite failure as a pre-existing condition, do not attempt to install the missing dependencies, and use linting and manual code review to verify correctness instead. Always check On branch jules-10950478820373986056-54aebd79
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   backend/uef-gateway/src/magazines/store.ts

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   .jules/bolt.md and restore unintended  modifications before submitting.
## 2026-06-05 - Test suite failures shouldn't violate package.json constraints
**Learning:** If tests fail because dependencies like ts-jest or @types/jest are completely missing, running npm install to fix them will modify package.json, which violates Bolt's strict boundary 'Never do: Modify package.json or tsconfig.json without instruction'.
**Action:** If tests are fundamentally broken due to missing packages and you cannot update package.json, accept the test suite failure as a pre-existing condition, do not attempt to install the missing dependencies, and use linting and manual code review to verify correctness instead. Always check git status and restore unintended package.json modifications before submitting.
