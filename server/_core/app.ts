import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerBlobUploadRoute } from "../blobUploadRoute";
import { appRouter } from "../routers";
import { createContext } from "./context";

/** يبني تطبيق Express نفسه للتشغيل المحلي أو كدالة Vercel. */
export function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerBlobUploadRoute(app);
  registerOAuthRoutes(app);
  app.use("/api/trpc", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
    next();
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        const cause = error.cause as { code?: unknown; cause?: { code?: unknown } } | undefined;
        const nestedCauseCode = cause?.cause?.code;
        const causeCode = typeof cause?.code === "string"
          ? cause.code
          : typeof nestedCauseCode === "string"
            ? nestedCauseCode
            : "UNKNOWN";
        console.error("[tRPC] Procedure failed", { path, code: error.code, causeCode });
      },
    }),
  );
  return app;
}
