import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("celebration motion", () => {
  it("starts celebration details immediately while keeping the announcement ticker independent", () => {
    const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    const celebrationRule = css.match(/\.celebration-body-track\s*\{([^}]+)\}/)?.[1] ?? "";
    const announcementRule = css.match(/\.announcement-ticker-track\s*\{([^}]+)\}/)?.[1] ?? "";

    expect(celebrationRule).toContain("animation-delay: -8s");
    expect(celebrationRule).toContain("celebration-body-scroll 32s");
    expect(announcementRule).toContain("ticker-right 14s");
  });

  it("يستخدم fallback فورياً عندما تكون استجابة المحتوى فارغة", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("const sourceItems = publicContent.data && publicContent.data.length > 0 ? publicContent.data : publishedContentFallback;");
    expect(source).toContain("const activeCelebration = useMemo(() => celebrationItems.find");
  });

  it("يبقي التهنئة مستقلة عن عداد الوقت بعد إزالته", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(source).toContain("activeCelebration.title");
    expect(source).toContain("activeCelebration.thumbnailUrl || activeCelebration.mediaUrl");
    expect(source).not.toContain("متبقي");
    expect(source).not.toContain("celebration-timer");
    expect(css).not.toContain(".celebration-timer");
  });
});

