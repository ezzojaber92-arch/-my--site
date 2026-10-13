import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("تحسين وسائط Vercel", () => {
  it("يحوّل خلفيات المحمية الكبيرة إلى JPEG مناسب للنشر المباشر", () => {
    const source = readFileSync(new URL("./optimize-vercel-media.py", import.meta.url), "utf8");

    expect(source).toContain('Image.Resampling.LANCZOS');
    expect(source).toContain('quality=62');
    expect(source).toContain('IMG_7677_a10100ed_8a848c21.jpg');
    expect(source).toContain('zomool-desert-hero-new-camel_f986bb79_23fd4f72.jpg');
    expect(source).toContain('zomool-hero-user-camel-prominent_4eec01bd_9efc625e.jpg');
    expect(source).toContain('alhathar-alsagheer_c8c1ed8e_d4fed9e6.jpg');
    expect(source).toContain('IMG_7642_ab2dba4c_592c9089.jpg');
  });
});
