import express from "express";

export interface ContainerStatus {
  service: string;
  status: string;
  health: string;
}

export function oracleVerifier(): ContainerStatus {
  return {
    service: "oracle-verifier",
    status: "TODO",
    health: "ok",
  };
}

// ---------------------------------------------------------------------------
// Standalone server mode (when run as separate container)
// ---------------------------------------------------------------------------
if (import.meta.main || process.argv[1]?.includes("oracle-verifier")) {
  const app = express();
  const PORT = parseInt(process.env.PORT || "8084", 10);

  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  app.get("/health", (_req, res) => {
    res.json(oracleVerifier());
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[oracle-verifier] listening on port ${PORT}`);
  });
}
