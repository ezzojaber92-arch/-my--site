import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const home = readFileSync(path.join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const app = readFileSync(path.join(process.cwd(), "server/_core/app.ts"), "utf8");

describe("fresh camel QR data", () => {
  it("refetches public camel data and photos whenever the QR page opens", () => {
    expect(home).toContain('refetchOnMount: "always" as const');
    expect(home).toContain("const publicCamels = trpc.camel.listPublic.useQuery(undefined, freshQueryOptions);");
    expect(home).toContain("const selectedCamelPhotos = trpc.camelPhotos.list.useQuery(galleryInput, { ...freshQueryOptions, enabled: Boolean(selectedCamel?.databaseId) });");
    expect(home).toContain("const selectedIsFresh = selectedCamel?.databaseId === sharedCamel.databaseId");
    expect(home).toContain("setSelectedCamel(sharedCamel);");
    expect(home).toContain("if (!publicCamels.isFetchedAfterMount || publicCamels.isFetching) return;");
    expect(home).toContain("selectedCamelPhotos.isFetchedAfterMount && !selectedCamelPhotos.isFetching");
    expect(home).toContain("const cacheBustedMedia = (url: string)");
    expect(home).toContain("src={cacheBustedMedia(activeGalleryImage ?? selectedCamel.image)}");
  });

  it("marks tRPC responses as non-cacheable so Vercel cannot serve stale records", () => {
    expect(app).toContain('res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");');
    expect(app).toContain('res.setHeader("CDN-Cache-Control", "no-store");');
    expect(app).toContain('res.setHeader("Vercel-CDN-Cache-Control", "no-store");');
  });
});
