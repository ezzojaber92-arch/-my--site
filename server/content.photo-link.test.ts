import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  addContentComment: vi.fn(),
  createCamelPhoto: vi.fn(),
  createCamelProductionLink: vi.fn(),
  createCamelRecord: vi.fn(),
  createContentItem: vi.fn(),
  deleteCamelPhoto: vi.fn(),
  deleteCamelProductionLink: vi.fn(),
  deleteCamelRecord: vi.fn(),
  deleteContentItem: vi.fn(),
  ensureCamelPhoto: vi.fn(),
  getContentEngagement: vi.fn(),
  getReserveSettings: vi.fn(),
  grantAdminEmailAccess: vi.fn(),
  listAdminEmailAccess: vi.fn(),
  listAllCamelRecords: vi.fn(),
  listAllContentItems: vi.fn(),
  listCamelPhotoCounts: vi.fn(),
  listCamelPhotos: vi.fn(),
  listCamelProductionLinks: vi.fn(),
  listPublicCamelRecords: vi.fn(),
  listPublicContentItems: vi.fn(),
  revokeAdminEmailAccess: vi.fn(),
  toggleContentLike: vi.fn(),
  updateCamelRecord: vi.fn(),
  updateCamelProductionLink: vi.fn(),
  updateContentItem: vi.fn(),
  updateReserveSettings: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, ...dbMocks };
});

import { appRouter } from "./routers";
import { ensureCamelPhotoWithDb } from "./db";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 100,
      openId: "admin-user",
      name: "Admin User",
      email: "admin@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("ربط صورة المنشور بسجل البعير", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.createContentItem.mockResolvedValue({});
    dbMocks.ensureCamelPhoto.mockResolvedValue({ alreadyAdded: false });
    dbMocks.createCamelProductionLink.mockResolvedValue({});
    dbMocks.updateCamelProductionLink.mockResolvedValue({});
    dbMocks.listCamelProductionLinks.mockResolvedValue([]);
  });

  it("يقبل رابط التخزين المحلي الناتج من رفع صورة المعرض ويحفظه", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const photo = {
      camelRecordId: 2,
      imageUrl: "/manus-storage/reserve/100/camels/new-photo.jpg",
      mediaKey: "reserve/100/camels/new-photo.jpg",
      sortOrder: 0,
    };

    await caller.camelPhotos.create(photo);

    expect(dbMocks.createCamelPhoto).toHaveBeenCalledWith(photo);
  });

  it("يضيف صورة المنشور المرتبطة ببعير إلى معرضه تلقائياً", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.content.create({
      kind: "photo",
      title: "صورة إنتاج راهي ولد السريعة",
      body: null,
      mediaUrl: "https://example.com/rahi-production.jpg",
      mediaKey: "reserve/content/rahi-production.jpg",
      camelRecordId: 12,
      isPublished: true,
      sortOrder: 0,
      publishedAt: new Date(),
    });

    expect(dbMocks.ensureCamelPhoto).toHaveBeenCalledWith({
      camelRecordId: 12,
      imageUrl: "https://example.com/rahi-production.jpg",
      mediaKey: "reserve/content/rahi-production.jpg",
      sortOrder: 9999,
    });
  });

  it("يمرر إعادة حفظ صورة المنشور نفسها إلى حارس منع التكرار", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const payload = {
      kind: "photo" as const,
      title: "صورة إنتاج مكررة",
      body: null,
      mediaUrl: "https://example.com/duplicate-safe.jpg",
      mediaKey: "reserve/content/duplicate-safe.jpg",
      camelRecordId: 12,
      isPublished: true,
      sortOrder: 0,
      publishedAt: new Date(),
    };

    await caller.content.create(payload);
    await caller.content.create(payload);

    expect(dbMocks.ensureCamelPhoto).toHaveBeenCalledTimes(2);
    expect(dbMocks.ensureCamelPhoto).toHaveBeenLastCalledWith({
      camelRecordId: 12,
      imageUrl: "https://example.com/duplicate-safe.jpg",
      mediaKey: "reserve/content/duplicate-safe.jpg",
      sortOrder: 9999,
    });
  });

  it("يمرر تحديث منشور صورة مرتبط ببعير إلى حارس منع التكرار", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.content.update({
      id: 81,
      values: {
        kind: "photo",
        title: "صورة إنتاج محدثة",
        body: null,
        mediaUrl: "https://example.com/update-safe.jpg",
        mediaKey: "reserve/content/update-safe.jpg",
        camelRecordId: 12,
        isPublished: true,
        sortOrder: 0,
        publishedAt: new Date(),
      },
    });

    expect(dbMocks.ensureCamelPhoto).toHaveBeenCalledWith({
      camelRecordId: 12,
      imageUrl: "https://example.com/update-safe.jpg",
      mediaKey: "reserve/content/update-safe.jpg",
      sortOrder: 9999,
    });
  });

  it("يبقي معرض البعير على صورة واحدة عند إنشاء المنشور ثم تحديث الصورة نفسها", async () => {
    const storedPhotos = new Set<string>();
    const values = vi.fn(async (photo: { camelRecordId: number; imageUrl: string }) => {
      storedPhotos.add(`${photo.camelRecordId}:${photo.imageUrl}`);
    });
    const insert = vi.fn(() => ({ values }));
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => storedPhotos.has("12:https://example.com/sequence-safe.jpg") ? [{ id: 1 }] : []),
          })),
        })),
      })),
      insert,
    } as unknown as Parameters<typeof ensureCamelPhotoWithDb>[0];
    dbMocks.ensureCamelPhoto.mockImplementation((photo) => ensureCamelPhotoWithDb(db, photo));
    const caller = appRouter.createCaller(createAdminContext());
    const photoValues = {
      kind: "photo" as const,
      title: "صورة إنتاج متسلسلة",
      body: null,
      mediaUrl: "https://example.com/sequence-safe.jpg",
      mediaKey: "reserve/content/sequence-safe.jpg",
      camelRecordId: 12,
      isPublished: true,
      sortOrder: 0,
      publishedAt: new Date(),
    };

    await caller.content.create(photoValues);
    await caller.content.update({ id: 91, values: photoValues });

    expect(storedPhotos.size).toBe(1);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("لا يربط الخبر النصي أو الصورة غير المرتبطة ببعير بمعرض الصور", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.content.create({
      kind: "news",
      title: "خبر عام للمحمية",
      body: "تفاصيل الخبر",
      mediaUrl: null,
      mediaKey: null,
      camelRecordId: null,
      isPublished: true,
      sortOrder: 0,
      publishedAt: new Date(),
    });

    expect(dbMocks.ensureCamelPhoto).not.toHaveBeenCalled();
  });

  it("يحفظ مدة فيديو الإنتاج المرتبط ببعير دون إضافته إلى معرض الصور", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const video = {
      kind: "video" as const,
      title: "فيديو إنتاج راهي ولد السريعة",
      body: "نتيجة موثقة من إنتاج البعير",
      mediaUrl: "https://example.com/rahi-production.mp4",
      mediaKey: "reserve/content/rahi-production.mp4",
      durationSeconds: 183,
      camelRecordId: 12,
      isPublished: true,
      sortOrder: 0,
      publishedAt: new Date(),
    };

    await caller.content.create(video);

    expect(dbMocks.createContentItem).toHaveBeenCalledWith(video);
    expect(dbMocks.ensureCamelPhoto).not.toHaveBeenCalled();
  });

  it("يحفظ تعديل سجل البعير وإعدادات موضع صورته", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const values = {
      achievements: "6 سيارات ورموز موثقة",
      imagePositionX: 42,
      imagePositionY: 58,
      imageScale: 116,
      imageRotation: -4,
    };

    await caller.camel.update({ id: 12, values });

    expect(dbMocks.updateCamelRecord).toHaveBeenCalledWith(12, values);
  });

  it("يحفظ ويعدل تهنئة أو مناسبة قابلة للحذف من لوحة الإدارة", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const values = {
      kind: "celebration" as const,
      title: "تهنئة بمناسبة وطنية",
      body: "تتقدم المحمية بأطيب التهاني.",
      mediaUrl: null,
      mediaKey: null,
      camelRecordId: null,
      isPublished: true,
      sortOrder: 0,
      publishedAt: new Date("2026-08-25T10:00:00.000Z"),
    };

    await caller.content.create(values);
    await caller.content.update({ id: 150, values: { title: "تهنئة وطنية محدثة" } });
    await caller.content.remove({ id: 150 });

    expect(dbMocks.createContentItem).toHaveBeenCalledWith(values);
    expect(dbMocks.updateContentItem).toHaveBeenCalledWith(150, { title: "تهنئة وطنية محدثة" });
    expect(dbMocks.deleteContentItem).toHaveBeenCalledWith(150);
  });

  it("يحفظ إعلاناً مع فيديو مصغر دون تحويله إلى نوع فيديو", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const values = {
      kind: "announcement" as const,
      title: "إعلان فيديو من المحمية",
      body: "تفاصيل الإعلان المرئي.",
      mediaUrl: "https://example.com/announcement.mp4",
      mediaKey: "reserve/content/announcement.mp4",
      thumbnailUrl: "https://example.com/announcement-thumb.jpg",
      thumbnailKey: "reserve/content/announcement-thumb.jpg",
      durationSeconds: 16,
      camelRecordId: null,
      isPublished: true,
      sortOrder: 0,
      publishedAt: new Date("2026-08-25T10:00:00.000Z"),
    };

    await caller.content.create(values);

    expect(dbMocks.createContentItem).toHaveBeenCalledWith(values);
  });

  it("لا ينشئ صورة معرض مكررة عندما تكون الصورة موجودة للبعير نفسه", async () => {
    const limit = vi.fn().mockResolvedValue([{ id: 55 }]);
    const where = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where }));
    const values = vi.fn();
    const insert = vi.fn(() => ({ values }));
    const db = { select: vi.fn(() => ({ from })), insert } as unknown as Parameters<typeof ensureCamelPhotoWithDb>[0];

    const result = await ensureCamelPhotoWithDb(db, {
      camelRecordId: 12,
      imageUrl: "https://example.com/rahi-production.jpg",
      mediaKey: "reserve/content/rahi-production.jpg",
      sortOrder: 9999,
    });

    expect(result).toEqual({ alreadyAdded: true });
    expect(insert).not.toHaveBeenCalled();
  });

  it("ينشئ صورة المعرض مرة واحدة عندما لا توجد صورة مطابقة", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const where = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where }));
    const values = vi.fn().mockResolvedValue({});
    const insert = vi.fn(() => ({ values }));
    const db = { select: vi.fn(() => ({ from })), insert } as unknown as Parameters<typeof ensureCamelPhotoWithDb>[0];
    const photo = { camelRecordId: 12, imageUrl: "https://example.com/new-production.jpg", mediaKey: null, sortOrder: 9999 };

    const result = await ensureCamelPhotoWithDb(db, photo);

    expect(result).toEqual({ alreadyAdded: false });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(photo);
  });

  it("يضيف أكثر من رابط إنتاج للبعير نفسه مع تمييز منصة الرابط تلقائياً", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    await caller.camelProductionLinks.create({ camelRecordId: 12, title: "السريع لعمير بالحزمي", url: "https://www.youtube.com/watch?v=camel-production" });
    await caller.camelProductionLinks.create({ camelRecordId: 12, title: "إنتاج موثق آخر", url: "https://www.instagram.com/reel/camel-production" });

    expect(dbMocks.createCamelProductionLink).toHaveBeenNthCalledWith(1, {
      camelRecordId: 12,
      title: "السريع لعمير بالحزمي",
      url: "https://www.youtube.com/watch?v=camel-production",
      platform: "يوتيوب",
    });
    expect(dbMocks.createCamelProductionLink).toHaveBeenNthCalledWith(2, {
      camelRecordId: 12,
      title: "إنتاج موثق آخر",
      url: "https://www.instagram.com/reel/camel-production",
      platform: "إنستغرام",
    });
  });

  it("يرفض رابط إنتاج غير صالح قبل حفظه", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    await expect(caller.camelProductionLinks.create({ camelRecordId: 12, title: "عنوان صالح", url: "رابط غير صالح" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.createCamelProductionLink).not.toHaveBeenCalled();
  });

  it("يعدل رابط الإنتاج ويحفظ اسم المنصة الجديد تلقائياً", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    await caller.camelProductionLinks.update({
      id: 44,
      values: { title: "عنوان تيك توك محدث", url: "https://www.tiktok.com/@reserve/video/123" },
    });

    expect(dbMocks.updateCamelProductionLink).toHaveBeenCalledWith(44, {
      title: "عنوان تيك توك محدث",
      url: "https://www.tiktok.com/@reserve/video/123",
      platform: "تيك توك",
    });
  });

  it("يحذف رابط إنتاج محدداً من سجل البعير", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    await caller.camelProductionLinks.remove({ id: 44 });

    expect(dbMocks.deleteCamelProductionLink).toHaveBeenCalledWith(44);
  });
});
