import express from "express";

export interface ContainerStatus {
  service: string;
  status: string;
  health: string;
}

export function bamamaramGenerator(): ContainerStatus {
  return {
    service: "bamaram-generator",
    status: "TODO",
    health: "ok",
  };
}

// ---------------------------------------------------------------------------
// Standalone server mode (when run as separate container)
// ---------------------------------------------------------------------------
if (import.meta.main || process.argv[1]?.includes("bamaram-generator")) {
  const app = express();
  const PORT = parseInt(process.env.PORT || "8085", 10);

  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  app.get("/health", (_req, res) => {
    res.json(bamamaramGenerator());
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[bamaram-generator] listening on port ${PORT}`);
  });
}
