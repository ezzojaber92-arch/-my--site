import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel configuration", () => {
  it("includes explicit pre-bundled function entries for the API and its health check", () => {
    const apiFunction = path.resolve(import.meta.dirname, "..", "api", "[...path].mjs");
    const trpcFunction = path.resolve(import.meta.dirname, "..", "api", "trpc", "[...path].mjs");
    const healthFunction = path.resolve(import.meta.dirname, "..", "api", "health.ts");
    const storageFunction = path.resolve(import.meta.dirname, "..", "api", "storage", "[...path].mjs");

    expect(fs.existsSync(apiFunction)).toBe(true);
    expect(fs.existsSync(trpcFunction)).toBe(true);
    expect(fs.existsSync(healthFunction)).toBe(true);
    expect(fs.existsSync(storageFunction)).toBe(true);
    expect(fs.readFileSync(apiFunction, "utf8")).toContain("server/_generated/vercel-handler.mjs");
    expect(fs.readFileSync(trpcFunction, "utf8")).toContain("server/_generated/vercel-handler.mjs");
    expect(fs.readFileSync(storageFunction, "utf8")).toContain("server/_generated/vercel-handler.mjs");
  });

  it("creates the server bundle before Vercel discovers API functions", () => {
    const packagePath = path.resolve(import.meta.dirname, "..", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { scripts?: { build?: string } };

    expect(packageJson.scripts?.build).toContain("server/vercel-handler.ts");
    expect(packageJson.scripts?.build).toContain("server/_generated/vercel-handler.mjs");
  });

  it("logs only a safe cause code when a tRPC procedure fails", () => {
    const appPath = path.resolve(import.meta.dirname, "_core", "app.ts");
    const appSource = fs.readFileSync(appPath, "utf8");

    expect(appSource).toContain("[tRPC] Procedure failed");
    expect(appSource).toContain("causeCode");
    expect(appSource).toContain("nestedCauseCode");
    expect(appSource).not.toContain("cause: error.cause");
  });

  it("keeps API and media requests out of the Vite SPA fallback", () => {
    const configPath = path.resolve(import.meta.dirname, "..", "vercel.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
      outputDirectory?: string;
      rewrites?: Array<{ source: string; destination: string }>;
    };

    expect(config.outputDirectory).toBe("dist/public");
    expect(config.rewrites).toContainEqual({
      source: "/manus-storage/:path*",
      destination: "/api/storage/:path*",
    });
    expect(config.rewrites).toContainEqual({
      source: "/:path((?!api(?:/|$)|media(?:/|$)).*)",
      destination: "/index.html",
    });
  });
});
