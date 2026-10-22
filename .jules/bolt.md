## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2026-03-24 - TypedArray reduce in 60fps loops
**Learning:** Using functional array methods like `reduce` on TypedArrays (e.g., `Uint8Array`) inside `requestAnimationFrame` loops causes unnecessary V8 overhead and garbage collection, severely impacting 60fps animation performance.
**Action:** Replace functional array methods like `reduce` with standard `for` loops when working with TypedArrays in high-frequency React animation loops.
## 2024-05-18 - [Parallelize Evidence Locker GCS network calls]
**Learning:** Sequential asynchronous network requests inside `for...of` loops are a hidden bottleneck for latency, especially when dealing with high-volume remote operations like fetching Google Cloud Storage metadata. Refactoring these loops to use `Promise.all` with `.map()` significantly cuts down total execution time by allowing concurrent requests.
**Action:** Always scan for `for...of` loops that purely execute independent `await` calls and refactor them to use `Promise.all` mapping to reduce latency.

## 2024-05-18 - [Parallelize Shopping Agent Scouting]
**Learning:** Sequential asynchronous network requests inside `for...of` loops are a hidden bottleneck for latency, especially when dealing with high-volume remote operations like fetching products using the shopping agent. Refactoring these loops to use `Promise.all` with `.map()` significantly cuts down total execution time by allowing concurrent requests.
**Action:** Always scan for `for...of` loops that purely execute independent `await` calls and refactor them to use `Promise.all` mapping to reduce latency.
