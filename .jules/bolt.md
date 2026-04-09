## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2026-03-24 - TypedArray reduce in 60fps loops
**Learning:** Using functional array methods like `reduce` on TypedArrays (e.g., `Uint8Array`) inside `requestAnimationFrame` loops causes unnecessary V8 overhead and garbage collection, severely impacting 60fps animation performance.
**Action:** Replace functional array methods like `reduce` with standard `for` loops when working with TypedArrays in high-frequency React animation loops.

## 2024-05-23 - Prevent High-Frequency Re-renders at the Leaf Node
**Learning:** Managing high-frequency updates, such as 60fps audio levels from microphone input using `useAudioLevel`, high up in a component tree (e.g., `ChatInterface`) forces unnecessary, expensive re-renders of the entire subtree.
**Action:** Isolate high-frequency state by removing it from high-level components and instead passing the underlying raw object (e.g., the `MediaStream`) to the memoized leaf-node component (e.g., `VoiceInputBtn`). Have the leaf node consume the hook directly, ensuring fast, localized UI updates without impacting application performance.
