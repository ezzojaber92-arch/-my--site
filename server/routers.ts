import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addContentComment,
  createCamelPhoto,
  updateCamelPhoto,
  createCamelProductionLink,
  createCamelRecord,
  createContentItem,
  deleteCamelPhoto,
  deleteCamelProductionLink,
  deleteCamelRecord,
  deleteContentItem,
  ensureCamelPhoto,
  getContentEngagement,
  getReserveSettings,
  ensureAdminEmailPasswordSchema,
  getAdminEmailAccess,
  grantAdminEmailAccess,
  listAdminEmailAccess,
  setAdminEmailPasswordHash,
  listAllCamelRecords,
  listAllContentItems,
  listCamelPhotoCounts,
  listCamelPhotos,
  setCamelPhotoAsPrimary,
  listCamelProductionLinks,
  listPublicCamelRecords,
  listPublicContentItems,
  revokeAdminEmailAccess,
  toggleContentLike,
  updateCamelRecord,
  updateCamelProductionLink,
  updateContentItem,
  updateReserveSettings,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  assertLoginAllowed,
  clearLoginFailures,
  createExternalAdminSession,
  EXTERNAL_ADMIN_COOKIE,
  hashAdminAccountPassword,
  externalAdminCookieOptions,
  recordLoginFailure,
  verifyAdminAccountPassword,
  verifyAdminPassword,
} from "./externalAdminAuth";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storageDelete, storagePut } from "./storage";

const camelInput = z.object({
  recordCode: z.string().min(1).max(32),
  name: z.string().min(1).max(255),
  imageUrl: z.string().min(1).max(1024),
  imagePositionX: z.number().int().min(0).max(100),
  imagePositionY: z.number().int().min(0).max(100),
  imageScale: z.number().int().min(50).max(220),
  imageRotation: z.number().int().min(-180).max(180),
  shade: z.string().min(1).max(255),
  owner: z.string().min(1).max(255),
  father: z.string().min(1).max(255),
  mother: z.string().min(1).max(255),
  maternalSibling: z.string().nullable().optional(),
  maternalSiblingLabel: z.string().min(1).max(100),
  status: z.string().min(1),
  achievements: z.string().min(1),
  production: z.string().min(1),
  worker: z.string().min(1).max(255),
  phone: z.string().min(1).max(64),
  subscriptionUrl: z.string().trim().url().max(1024).nullable().optional(),
  achievementsUrl: z.string().trim().url().max(1024).nullable().optional(),
  note: z.string().min(1),
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

const contentInput = z.object({
  kind: z.enum(["news", "announcement", "celebration", "photo", "video"]),
  title: z.string().min(1).max(255),
  body: z.string().nullable().optional(),
  mediaUrl: z.string().nullable().optional(),
  mediaKey: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  thumbnailKey: z.string().nullable().optional(),
  durationSeconds: z.number().int().min(0).max(24 * 60 * 60).nullable().optional(),
  camelRecordId: z.number().int().positive().nullable().optional(),
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  publishedAt: z.date(),
});

const reserveSettingsInput = z.object({
  reserveName: z.string().trim().min(1).max(255),
  locationName: z.string().trim().min(1).max(255),
  mapUrl: z.string().url().max(1024),
  phone: z.string().trim().min(1).max(64),
  veterinaryService: z.string().trim().min(1),
  climateService: z.string().trim().min(1),
  visitHours: z.string().trim().min(1).max(255),
  visitDescription: z.string().trim().min(1),
});

const adminEmailInput = z.object({ email: z.string().trim().toLowerCase().email().max(320) });
const storedMediaUrl = z.string().trim().max(1024).refine((value) => {
  if (/^https?:\/\//i.test(value)) return true;
  return value.startsWith("/manus-storage/") || value.startsWith("/media/");
}, "رابط الصورة يجب أن يكون رابط تخزين صالحاً.");
const camelPhotoInput = z.object({ camelRecordId: z.number().int().positive(), imageUrl: storedMediaUrl, mediaKey: z.string().nullable().optional(), sortOrder: z.number().int().min(0).max(9999) });
const camelPhotoAdjustmentInput = z.object({
  id: z.number().int().positive(),
  values: z.object({
    imagePositionX: z.number().int().min(0).max(100),
    imagePositionY: z.number().int().min(0).max(100),
    imageScale: z.number().int().min(50).max(220),
    imageRotation: z.number().int().min(-180).max(180),
  }),
});
const camelProductionLinkInput = z.object({
  camelRecordId: z.number().int().positive(),
  title: z.string().trim().min(1).max(255),
  url: z.string().trim().url().max(512),
});
const contentItemIdInput = z.object({ contentItemId: z.number().int().positive() });

function getProductionLinkPlatform(url: string) {
  const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  if (hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be") return "يوتيوب";
  if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) return "إنستغرام";
  if (hostname === "tiktok.com" || hostname.endsWith(".tiktok.com")) return "تيك توك";
  if (hostname === "facebook.com" || hostname.endsWith(".facebook.com") || hostname === "fb.watch") return "فيسبوك";
  if (hostname === "x.com" || hostname.endsWith(".x.com") || hostname === "twitter.com" || hostname.endsWith(".twitter.com")) return "إكس";
  return "رابط خارجي";
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ email: z.string().trim().toLowerCase().email().optional(), password: z.string().min(8).max(256) }))
      .mutation(async ({ ctx, input }) => {
        try {
          assertLoginAllowed(ctx.req);
        } catch {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "محاولات الدخول كثيرة. انتظر قليلاً ثم حاول مرة أخرى." });
        }

        try {
          await ensureAdminEmailPasswordSchema();
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر تجهيز قاعدة بيانات الإدارة. حاول مرة أخرى." });
        }

        let sessionEmail: string | null = null;
        let valid = false;
        if (input.email) {
          const access = await getAdminEmailAccess(input.email);
          if (!access) {
            recordLoginFailure(ctx.req);
            throw new TRPCError({ code: "UNAUTHORIZED", message: "هذا البريد غير مضاف في قائمة مسؤولي المحمية." });
          }
          if (access.passwordHash) {
            valid = await verifyAdminAccountPassword(input.password, access.passwordHash);
          } else {
            try {
              await setAdminEmailPasswordHash(input.email, await hashAdminAccountPassword(input.password));
              valid = true;
            } catch {
              throw new TRPCError({ code: "BAD_REQUEST", message: "كلمة المرور يجب أن تكون 8 أحرف أو أكثر." });
            }
          }
          sessionEmail = input.email;
        } else {
          try {
            valid = verifyAdminPassword(input.password);
          } catch {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خدمة دخول الإدارة غير مهيأة بعد." });
          }
        }
        if (!valid) {
          recordLoginFailure(ctx.req);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "البريد أو كلمة المرور غير صحيحة." });
        }

        clearLoginFailures(ctx.req);
        const token = await createExternalAdminSession(sessionEmail);
        ctx.res.cookie(EXTERNAL_ADMIN_COOKIE, token, externalAdminCookieOptions(ctx.req));
        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(EXTERNAL_ADMIN_COOKIE, { ...externalAdminCookieOptions(ctx.req), maxAge: 0 });
      return {
        success: true,
      } as const;
    }),
  }),
  camel: router({
    listPublic: publicProcedure.query(() => listPublicCamelRecords()),
    listAll: adminProcedure.query(() => listAllCamelRecords()),
    create: adminProcedure.input(camelInput).mutation(({ input }) => createCamelRecord(input)),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), values: camelInput.partial() }))
      .mutation(({ input }) => updateCamelRecord(input.id, input.values)),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteCamelRecord(input.id)),
  }),
  camelPhotos: router({
    list: publicProcedure.input(z.object({ camelRecordId: z.number().int().positive() })).query(({ input }) => listCamelPhotos(input.camelRecordId)),
    counts: publicProcedure.query(() => listCamelPhotoCounts()),
    create: adminProcedure.input(camelPhotoInput).mutation(({ input }) => createCamelPhoto(input)),
    update: adminProcedure.input(camelPhotoAdjustmentInput).mutation(async ({ input }) => {
      const updated = await updateCamelPhoto(input.id, input.values);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "الصورة غير موجودة." });
      return { success: true } as const;
    }),
    setPrimary: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const updated = await setCamelPhotoAsPrimary(input.id);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "الصورة غير موجودة." });
      return { success: true, camelRecordId: updated.camelRecordId } as const;
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const deleted = await deleteCamelPhoto(input.id);
      if (deleted?.mediaKey) await storageDelete(deleted.mediaKey);
      return { success: true } as const;
    }),
  }),
  camelProductionLinks: router({
    list: publicProcedure.input(z.object({ camelRecordId: z.number().int().positive() }))
      .query(({ input }) => listCamelProductionLinks(input.camelRecordId)),
    create: adminProcedure.input(camelProductionLinkInput).mutation(({ input }) => createCamelProductionLink({
      camelRecordId: input.camelRecordId,
      title: input.title,
      url: input.url,
      platform: getProductionLinkPlatform(input.url),
    })),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), values: camelProductionLinkInput.pick({ title: true, url: true }) }))
      .mutation(({ input }) => updateCamelProductionLink(input.id, {
        title: input.values.title,
        url: input.values.url,
        platform: getProductionLinkPlatform(input.values.url),
      })),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteCamelProductionLink(input.id)),
  }),
  content: router({
    listPublic: publicProcedure.query(() => listPublicContentItems()),
    listAll: adminProcedure.query(() => listAllContentItems()),
    create: adminProcedure.input(contentInput).mutation(async ({ input }) => {
      const result = await createContentItem(input);
      if (input.kind === "photo" && input.camelRecordId && input.mediaUrl) {
        await ensureCamelPhoto({ camelRecordId: input.camelRecordId, imageUrl: input.mediaUrl, mediaKey: input.mediaKey ?? null, sortOrder: 9999 });
      }
      return result;
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), values: contentInput.partial() }))
      .mutation(async ({ input }) => {
        const result = await updateContentItem(input.id, input.values);
        if (input.values.kind === "photo" && input.values.camelRecordId && input.values.mediaUrl) {
          await ensureCamelPhoto({ camelRecordId: input.values.camelRecordId, imageUrl: input.values.mediaUrl, mediaKey: input.values.mediaKey ?? null, sortOrder: 9999 });
        }
        return result;
      }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const deleted = await deleteContentItem(input.id);
        if (deleted) {
          await storageDelete(deleted.mediaKey ?? deleted.mediaUrl);
          await storageDelete(deleted.thumbnailKey ?? deleted.thumbnailUrl);
        }
        return { success: true } as const;
      }),
    engagement: publicProcedure.input(contentItemIdInput).query(({ input, ctx }) => getContentEngagement(input.contentItemId, ctx.user?.id, ctx.visitorToken)),
    toggleLike: publicProcedure.input(contentItemIdInput).mutation(({ input, ctx }) => toggleContentLike(input.contentItemId, ctx.user?.id, ctx.visitorToken)),
    addComment: publicProcedure.input(z.object({ contentItemId: z.number().int().positive(), body: z.string().trim().min(1).max(1000) }))
      .mutation(({ input, ctx }) => addContentComment(input.contentItemId, ctx.user?.id, input.body, ctx.visitorToken)),
  }),
  adminAccess: router({
    list: adminProcedure.query(async () => (await listAdminEmailAccess()).map(({ passwordHash, ...access }) => ({ ...access, passwordSet: Boolean(passwordHash) }))),
    add: adminProcedure.input(adminEmailInput)
      .mutation(({ input, ctx }) => grantAdminEmailAccess(input.email, ctx.user.id)),
    resetPassword: adminProcedure.input(adminEmailInput)
      .mutation(({ input }) => setAdminEmailPasswordHash(input.email, null)),
    remove: adminProcedure.input(adminEmailInput)
      .mutation(({ input, ctx }) => {
        if (ctx.user.email?.trim().toLowerCase() === input.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكنك سحب صلاحية الإدارة من حسابك الحالي." });
        }
        return revokeAdminEmailAccess(input.email);
      }),
  }),
  reserve: router({
    getPublic: publicProcedure.query(() => getReserveSettings()),
    get: adminProcedure.query(() => getReserveSettings()),
    update: adminProcedure.input(reserveSettingsInput)
      .mutation(({ input }) => updateReserveSettings(input)),
  }),
  media: router({
    upload: adminProcedure.input(z.object({
      fileName: z.string().min(1).max(255),
      contentType: z.string().min(1).max(128),
      dataUrl: z.string().min(1),
      folder: z.enum(["camels", "content"]),
    })).mutation(async ({ input, ctx }) => {
      const commaIndex = input.dataUrl.indexOf(",");
      const base64 = commaIndex >= 0 ? input.dataUrl.slice(commaIndex + 1) : input.dataUrl;
      const bytes = Buffer.from(base64, "base64");
      const maxBytes = 25 * 1024 * 1024;
      if (bytes.length === 0 || bytes.length > maxBytes) {
        throw new Error("حجم الملف يجب أن يكون بين 1 بايت و25 ميغابايت.");
      }
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      return storagePut(`reserve/${ctx.user.id}/${input.folder}/${safeName}`, bytes, input.contentType);
    }),
  }),
});

export type AppRouter = typeof appRouter;
