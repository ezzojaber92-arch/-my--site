import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("camel primary photo", () => {
  it("exposes a protected setPrimary procedure and an admin control", () => {
    const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
    const adminSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Admin.tsx"), "utf8");

    expect(routerSource).toContain("setPrimary: adminProcedure");
    expect(routerSource).toContain("setCamelPhotoAsPrimary");
    expect(adminSource).toContain("تعيين أساسية");
    expect(adminSource).toContain("setCamelGalleryPhotoAsPrimary");
  });
});
