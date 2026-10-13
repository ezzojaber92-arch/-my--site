import { describe, expect, it } from "vitest";
import { publicMediaUrl } from "./publicMediaUrl";

describe("publicMediaUrl", () => {
  it("resolves a previous storage path to an independent media bundle on an external deployment", () => {
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { hostname: "zomool-al-khaili.vercel.app" } } });
    expect(publicMediaUrl("/manus-storage/alhathar-alsagheer_c8c1ed8e.png")).toBe("/media/alhathar-alsagheer_c8c1ed8e_d4fed9e6.jpg");
    expect(publicMediaUrl("/manus-storage/rahi-weld-alsareea_68f66fcf.png")).toBe("/media/IMG_7677_a10100ed_8a848c21.jpg");
    expect(publicMediaUrl("/manus-storage/IMG_7642_ab2dba4c_592c9089.jpeg")).toBe("/media/IMG_7642_ab2dba4c_592c9089.jpg");
    expect(publicMediaUrl("/manus-storage/reserve/1/content/IMG_7675_43657a15_0420cbe8.jpeg")).toBe("/media/IMG_7675_43657a15_0420cbe8.jpg");
    expect(publicMediaUrl("/manus-storage/reserve/270001/camels/IMG_7677_a10100ed.png")).toBe("/media/IMG_7677_a10100ed_8a848c21.jpg");
    expect(publicMediaUrl("/manus-storage/reserve/270001/content/IMG_7675_43657a15.jpeg")).toBe("/media/IMG_7675_43657a15_0420cbe8.jpg");
    expect(publicMediaUrl("/manus-storage/zomool-mark_69b1a465.png")).toBe("/media/reserve-logo_7954e6d6.png");
    expect(publicMediaUrl("/manus-storage/v29044g50000d5ciac7og65i2dad18v0_e18747fd_36eaaa24.mp4")).toBe("/media/v29044g50000d5ciac7og65i2dad18v0_e18747fd_36eaaa24.mp4");
    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  });

  it("routes a newly uploaded storage path through the live storage proxy", () => {
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { hostname: "zomoolreserve.vercel.app" } } });
    expect(publicMediaUrl("/manus-storage/camels/owner 1/new-photo.jpg")).toBe("/api/storage/camels/owner%201/new-photo.jpg");
    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  });

  it("maps direct TiDB media paths to bundled Vercel files", () => {
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { hostname: "zomoolreserve.vercel.app" } } });
    expect(publicMediaUrl("/media/alhathar-alsagheer_c8c1ed8e.png")).toBe("/media/alhathar-alsagheer_c8c1ed8e_d4fed9e6.jpg");
    expect(publicMediaUrl("/media/enad_b3b0ae58_996cf3af.png")).toBe("/media/enad_b3b0ae58_996cf3af.jpg");
    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  });

  it("preserves external URLs and empty media values", () => {
    expect(publicMediaUrl("https://example.com/camel.jpg")).toBe("https://example.com/camel.jpg");
    expect(publicMediaUrl(null)).toBeNull();
  });

  it("يبقي نسخة Manus مرتبطة بالصور الأصلية التي يوفّرها تخزينها", () => {
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { hostname: "zomoolreserv-9qm89e3w.manus.space" } } });

    expect(publicMediaUrl("/manus-storage/zomool-desert-hero-new-camel_f986bb79.png")).toBe("https://zomoolreserv-9qm89e3w.manus.space/manus-storage/zomool-desert-hero-new-camel_f986bb79.png");
    expect(publicMediaUrl("/manus-storage/alhathar-alsagheer_c8c1ed8e.png")).toBe("https://zomoolreserv-9qm89e3w.manus.space/manus-storage/alhathar-alsagheer_c8c1ed8e.png");

    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  });

  it("uses the bundle for preview and every other non-production hostname", () => {
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { hostname: "3000-preview.manus.computer" } } });
    expect(publicMediaUrl("/manus-storage/zomool-mark_69b1a465.png")).toBe("/media/reserve-logo_7954e6d6.png");
    expect(publicMediaUrl("/manus-storage/zomool-desert-hero-new-camel_f986bb79.png")).toBe("/media/zomool-desert-hero-new-camel_f986bb79_23fd4f72.jpg");
    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  });
});
