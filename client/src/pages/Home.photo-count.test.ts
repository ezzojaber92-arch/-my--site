import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("عداد صور بطاقة البعير", () => {
  it("يعرض تسمية ثابتة لصور البطاقة الخارجية ويحافظ على دالة المعرض", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("formatCamelCardPhotoLabel");
    expect(source).toContain("formatPhotoCount");
  });

  it("يعرض صور البعير في البطاقة الخارجية فقط ويحافظ على عداد المعرض الداخلي", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain('function formatCamelCardPhotoLabel()');
    expect(source).toContain('return "صور البعير";');
    expect(source).toContain("{formatCamelCardPhotoLabel()}");
    expect(source).toContain("<span className=\"camel-photo-count\"><Images size={14} /> {formatCamelCardPhotoLabel()}</span>");
    expect(source).not.toContain("{camel.databaseId && <span className=\"camel-photo-count\">");
    expect(source).toContain("<div className=\"camel-gallery-dots\" role=\"tablist\"");
    expect(source).toContain("className=\"camel-gallery-arrow\"");
    expect(source).toContain("aria-label={`التنقل بين صور ${selectedCamel.name}`}");
    expect(source).not.toContain("camel-gallery-thumbnails");
    expect(source).not.toContain("<strong>{formatPhotoCount(selectedCamelImages.length)}</strong>");
    expect(source).toContain('if (count === 1) return "صورة واحدة";');
    expect(source).toContain('if (count === 2) return "صورتان";');
  });
});
