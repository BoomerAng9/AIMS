## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.
## 2024-05-23 - Memoizing Message Lists
**Learning:** In chat interfaces, streaming responses cause frequent re-renders of the parent component. If list items (like `MessageBubble`) are not memoized, all previous messages re-render on every chunk.
**Action:** Always wrap list items that receive primitive props in `React.memo()`, especially in components that receive high-frequency streaming updates.
