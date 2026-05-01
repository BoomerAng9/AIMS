## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2026-03-24 - TypedArray reduce in 60fps loops
**Learning:** Using functional array methods like `reduce` on TypedArrays (e.g., `Uint8Array`) inside `requestAnimationFrame` loops causes unnecessary V8 overhead and garbage collection, severely impacting 60fps animation performance.
**Action:** Replace functional array methods like `reduce` with standard `for` loops when working with TypedArrays in high-frequency React animation loops.

## 2026-05-01 - Optimize Byte Length Calculation in React Components
**Learning:** Using `new Blob([string]).size` to calculate byte length inside React components or hooks (like `useMemo`) creates unnecessary Blob object instantiations and Garbage Collection pressure, especially when calculating totals for loops/arrays.
**Action:** Use `TextEncoder.encode(string).length` for string byte length calculations. Ensure the `TextEncoder` is instantiated once as a module-level constant to prevent repeated instantiations on every render, and always check `typeof` before encoding to handle potential binary blob data safely.
