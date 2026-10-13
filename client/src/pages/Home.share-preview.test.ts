import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("مشاركة روابط الموقع", () => {
  it("ترسل العنوان والرابط فقط في مشاركة المحمية والبعير والمنشور", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("const shareData = { title: item.title, url };");
    expect(source).toContain("await navigator.share({ title, url });");
    expect(source).toContain("await navigator.share({ title: item.title, url });");
    expect(source).toContain("const shareData = {\n      title: reserve.reserveName,\n      url: getReserveUrl(),\n    };");
    expect(source).toContain("zomool-sheikh-tahnoun-reserve");
  });

  it("يستخدم اسم البعير عنواناً ديناميكياً عند فتح سجله", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("const title = selectedCamel ? selectedCamel.name : reserveTitle;");
    expect(source).toContain('meta[property="og:title"]');
    expect(source).toContain("onClick={() => shareQrLink(selectedCamel.name, getCamelUrl(selectedCamel))}");
  });

  it("يفتح فيديو المحمية داخل بطاقة التفاصيل مع بياناته عند المشاركة", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
    expect(source).toContain("const getContentShareUrl = (item: PublicContentItem) => getContentUrl(item);");
    expect(source).toContain('url.searchParams.set("post", String(item.id));');
    expect(source).toContain("selectedContent.title");
    expect(source).toContain("selectedContent.body");
    expect(source).toContain("selectedContent.durationSeconds");
  });

  it("لا يعرض زر تنزيل الفيديو أو وظيفة تنزيل ملف الوسائط", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).not.toContain("content-download");
    expect(source).not.toContain("downloadContentMedia");
    expect(source).not.toContain("جارٍ تجهيز تنزيل الفيديو");
    expect(source).toContain("const shareContent = async () => {");
    expect(source).toContain("selectedContentIsVideo ? <video controls playsInline preload=\"metadata\"");
  });

  it("ينسخ الاسم والرابط فقط عند عدم توفر مشاركة الهاتف", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("`${item.title}\\n${url}`");
    expect(source).toContain("title ? `${title}\\n${url}` : url");
    expect(source).toContain("`${reserve.reserveName}\\n${getReserveUrl()}`");
  });

  it("يمنع تهيئة سجل camel محلياً قبل اكتمال طلب البيانات", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("function getInitialSharedCamel()");
    expect(source).toContain("return null;");
    expect(source).toContain('new URLSearchParams(window.location.search).get("camel")');
    expect(source).toContain("const isSharedCamelRoutePending = Boolean(sharedCamelQueryCode");
    expect(source).toContain("جارٍ فتح سجل البعير المطلوب");
  });

  it("يطبع صيغ Z-001 وZ-01 وZ-1 إلى السجل نفسه عند فتح الرابط", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("function normalizeCamelCode(code: string)");
    expect(source).toContain("const normalizedCode = normalizeCamelCode(camelCode);");
    expect(source).toContain("normalizeCamelCode(camel.id) === normalizedCode");
    expect(source).toContain("normalizeCamelCode(camel.recordCode) === normalizedSharedCamelQueryCode");
  });

  it("يعرض حالة فتح الفيديو قبل تحميل رابط post", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
    expect(source).toContain("const [isOpeningSharedContent, setIsOpeningSharedContent] = useState(() => typeof window !== \"undefined\" && Boolean(new URLSearchParams(window.location.search).get(\"post\")))");
    expect(source).toContain("const isSharedContentRoutePending = isOpeningSharedContent && !selectedContent;");
    expect(source).toContain("جاري فتح الفيديو…");
  });

  it("ينتظر بيانات الرابط المطلوب ولا يعرض السجل الأول أثناء التحميل", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("const isSharedCamelRoutePending = Boolean(sharedCamelQueryCode");
    expect(source).toContain("جارٍ فتح سجل البعير المطلوب");
    expect(source).toContain("تعذر العثور على سجل البعير المطلوب");
    expect(source).toContain("isSharedCamelRoutePending");
  });

  it("يميز إغلاق الفيديو من رابط المشاركة عن الإغلاق الداخلي", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
    expect(source).toContain("const [contentOpenedFromSharedUrl, setContentOpenedFromSharedUrl] = useState(false);");
    expect(source).toContain("const contentScrollYRef = useRef<number | null>(null);");
    expect(source).toContain("contentScrollYRef.current = window.scrollY;");
    expect(source).toContain("setContentOpenedFromSharedUrl(sharedItem.kind === \"video\");");
    expect(source).toContain("setContentOpenedFromSharedUrl(false);");
    expect(source).toContain("const restoreScrollY = contentScrollYRef.current;");
    expect(source).toContain("window.scrollTo({ top: restoreScrollY, left: 0, behavior: \"auto\" })");
    expect(source).toContain("window.scrollTo({ top: 0, left: 0, behavior: \"auto\" })");
  });
});

it("لا يحتوي رأس الصفحة على وسم صورة أو أيقونة يمكن استخدامها كمعاينة", () => {
  const source = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  expect(source).not.toContain('property="og:image"');
  expect(source).not.toContain('rel="icon"');
});

it("لا يستخدم الموقع بطاقة Twitter كبيرة بصورة", () => {
  const source = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  expect(source).not.toContain("summary_large_image");
});

it("يحافظ على الاسم والرابط في بيانات معاينة الصفحة", () => {
  const source = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  expect(source).toContain('property="og:title"');
  expect(source).toContain('property="og:description"');
});
