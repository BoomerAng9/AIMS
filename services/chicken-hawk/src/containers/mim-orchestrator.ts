import express from "express";

export interface ContainerStatus {
  service: string;
  status: string;
  health: string;
}

export function mimOrchestrator(): ContainerStatus {
  return {
    service: "mim-orchestrator",
    status: "TODO",
    health: "ok",
  };
}

// ---------------------------------------------------------------------------
// Standalone server mode (when run as separate container)
// ---------------------------------------------------------------------------
if (import.meta.main || process.argv[1]?.includes("mim-orchestrator")) {
  const app = express();
  const PORT = parseInt(process.env.PORT || "8082", 10);

  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  app.get("/health", (_req, res) => {
    res.json(mimOrchestrator());
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[mim-orchestrator] listening on port ${PORT}`);
  });
}
