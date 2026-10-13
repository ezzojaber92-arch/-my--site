import { describe, expect, it, vi } from "vitest";

const engagementMocks = vi.hoisted(() => ({
  toggleContentLike: vi.fn(),
  addContentComment: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...engagementMocks };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createNonAdminContext(): TrpcContext {
  return {
    user: {
      id: 99,
      openId: "regular-user",
      name: "Regular User",
      email: "user@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

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

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
    visitorToken: "guest-token-123456",
  };
}

describe("لوحة إدارة المحمية", () => {
  it("تمنع المستخدم غير الإداري من الوصول إلى سجل الإبل الإداري", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(caller.camel.listAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("تمنع المستخدم غير الإداري من رفع الملفات", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(caller.media.upload({
      fileName: "camel.jpg",
      contentType: "image/jpeg",
      dataUrl: "data:image/jpeg;base64,AA==",
      folder: "camels",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("تمنع المستخدم غير الإداري من إضافة أو حذف صور معرض الإبل", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(caller.camelPhotos.create({ camelRecordId: 1, imageUrl: "https://example.com/camel.jpg", mediaKey: null, sortOrder: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.camelPhotos.remove({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.content.remove({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("تمنع المستخدم غير الإداري من إضافة أو حذف روابط إنتاج البعير", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(caller.camelProductionLinks.create({ camelRecordId: 1, title: "إنتاج بعير", url: "https://www.youtube.com/watch?v=camel" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.camelProductionLinks.remove({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("يسمح للزائر بالتفاعل العام مع بقاء الإدارة محمية", async () => {
    engagementMocks.toggleContentLike.mockResolvedValueOnce({ liked: true });
    engagementMocks.addContentComment.mockResolvedValueOnce({ inserted: true });
    const caller = appRouter.createCaller(createAnonymousContext());
    await expect(caller.content.toggleLike({ contentItemId: 1 })).resolves.toEqual({ liked: true });
    await expect(caller.content.addComment({ contentItemId: 1, body: "تعليق عام" })).resolves.toEqual({ inserted: true });
    expect(engagementMocks.toggleContentLike).toHaveBeenCalledWith(1, undefined, "guest-token-123456");
    expect(engagementMocks.addContentComment).toHaveBeenCalledWith(1, undefined, "تعليق عام", "guest-token-123456");
  });

  it("تمنع المستخدم غير الإداري من إضافة بريد مسؤول أو الاطلاع على المسؤولين", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(caller.adminAccess.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.adminAccess.add({ email: "new-admin@example.com" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("تحجب إدارة المسؤولين عن الزائر غير المسجل", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    await expect(caller.adminAccess.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("تتحقق من صحة بريد المسؤول قبل تنفيذ الإضافة أو السحب", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.adminAccess.add({ email: "بريد غير صالح" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.adminAccess.remove({ email: "غير صالح" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("تمنع المسؤول من سحب صلاحية حسابه الحالي بالخطأ", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.adminAccess.remove({ email: "admin@example.com" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("تمنع حفظ تكبير أو تدوير صورة البعير خارج النطاق الآمن", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.camel.update({ id: 1, values: { imageScale: 221 } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.camel.update({ id: 1, values: { imageRotation: 181 } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
