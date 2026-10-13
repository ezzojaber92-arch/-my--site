import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("فصل فيديو المحمية عن سجل البعير", () => {
  it("يعرض فيديوهات المحمية العامة في مصدر مستقل للصفحة الرئيسية", () => {
    expect(source).toContain('const reserveVideoItems = useMemo(() => contentItems.filter((item) => item.kind === "video" && item.camelRecordId === null), [contentItems]);');
    expect(source).toContain('className="reserve-updates reserve-video-section" aria-label="فيديوهات المحمية"');
    expect(source).toContain("فيديوهات عامة للمحمية تظهر هنا في الصفحة الرئيسية فقط");
  });

  it("لا يستخدم مساراً احتياطياً لإدراج فيديو المحمية داخل سجل البعير", () => {
    expect(source).not.toContain("reserveVideoFallback");
    expect(source).not.toContain('selectedCamelProductionPosts.length === 0 ? contentItems.filter((item) => item.kind === "video"');
  });

  it("يبقي فيديو المحمية قبل سجل البعير دون إنشاء أرشيف إعلان قديم", () => {
    const homepageVideoIndex = source.indexOf('className="reserve-updates reserve-video-section"');
    const camelDialogIndex = source.indexOf('className="camel-dialog"');

    expect(homepageVideoIndex).toBeGreaterThan(-1);
    expect(source).not.toContain("archivedAnnouncementItems");
    expect(source).not.toContain('className="announcement-archive"');
    expect(camelDialogIndex).toBeGreaterThan(homepageVideoIndex);
  });

  it("يعرض محتوى الفيديو كمعاينة ثابتة عند غياب thumbnail صالح", () => {
    expect(source).toContain("function hasUsableVideoThumbnail(thumbnailUrl: string | null)");
    expect(source).toContain('muted playsInline preload="metadata"');
    expect(source).toContain('controls playsInline preload="metadata" poster={selectedContent.thumbnailUrl || undefined}');
    expect(source).toContain('onLoadedData={(event) => event.currentTarget.pause()}');
    expect(source).not.toContain('autoPlay loop muted playsInline');
    expect(source).toContain('!thumbnailUrl.includes("/manus-storage/")');
  });

  it("يشارك فيديو المحمية عبر رابط بطاقة التفاصيل داخل صفحة المحمية", () => {
    expect(source).toContain("const getContentShareUrl = (item: PublicContentItem) => getContentUrl(item);");
    expect(source).toContain("const url = getContentShareUrl(item);");
    expect(source).toContain('url.searchParams.set("post", String(item.id));');
  });
});
