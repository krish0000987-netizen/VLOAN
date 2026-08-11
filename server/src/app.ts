import express from "express";
import cors from "cors";
import { createSchema } from "./db/schema.js";
import { ensureDemoUsers } from "./routes/auth.js";
import { seedIfEmpty } from "./db/seed.js";
import { authRouter } from "./routes/auth.js";
import { crmRouter } from "./routes/crm.js";
import { losRouter } from "./routes/los.js";
import { losExtrasRouter } from "./routes/los-extras.js";
import { lmsRouter } from "./routes/lms.js";
import { lmsExtrasRouter } from "./routes/lms-extras.js";
import { reconRouter } from "./routes/recon.js";
import { portalRouter } from "./routes/portal.js";
import { channelRouter } from "./routes/channel.js";
import { collectionsRouter } from "./routes/collections.js";
import { analyticsRouter } from "./routes/analytics.js";
import { adminRouter } from "./routes/admin.js";
import { errorHandler } from "./middleware.js";

/** Build the NEXUS API app. Schema creation and demo seeding run on first build. */
export function createApp() {
  createSchema();
  ensureDemoUsers();
  seedIfEmpty();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "nexus-api", environment: "DEMO" }));

  app.use("/api/auth", authRouter);
  app.use("/api", analyticsRouter);
  app.use("/api", crmRouter);
  app.use("/api", losExtrasRouter);
  app.use("/api", losRouter);
  app.use("/api", lmsRouter);
  app.use("/api", lmsExtrasRouter);
  app.use("/api", reconRouter);
  app.use("/api", portalRouter);
  app.use("/api", channelRouter);
  app.use("/api", collectionsRouter);
  app.use("/api/admin", adminRouter);

  app.use(errorHandler);
  return app;
}
