## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2024-06-05 - Referential Stability of Object Props in React
**Learning:** Passing an inline object or array to a component prop (like `components={{...}}` or `remarkPlugins={[...]}`) creates a new reference on every render, causing the child component (like `ReactMarkdown`) to unnecessarily re-render, even if the content of the object/array hasn't changed.
**Action:** Always extract static configuration objects and arrays to module-level constants outside the component, or use `useMemo` if they depend on component state. This ensures referential stability and prevents performance regressions.
