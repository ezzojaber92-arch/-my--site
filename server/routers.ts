import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addContentComment,
  createCamelPhoto,
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
  grantAdminEmailAccess,
  listAdminEmailAccess,
  listAllCamelRecords,
  listAllContentItems,
  listCamelPhotoCounts,
  listCamelPhotos,
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
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

const camelInput = z.object({
  recordCode: z.string().min(1).max(32),
  name: z.string().min(1).max(255),
  imageUrl: z.string().min(1).max(1024),
  imagePositionX: z.number().int().min(0).max(100),
  imagePositionY: z.number().int().min(0).max(100),
  imageScale: z.number().int().min(100).max(180),
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
const camelPhotoInput = z.object({ camelRecordId: z.number().int().positive(), imageUrl: z.string().url().max(512), mediaKey: z.string().nullable().optional(), sortOrder: z.number().int().min(0).max(9999) });
const camelProductionLinkInput = z.object({
  camelRecordId: z.number().int().positive(),
  title: z.string().trim().min(1).max(255),
  url: z.string().trim().url().max(1024),
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
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteCamelPhoto(input.id)),
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
      .mutation(({ input }) => deleteContentItem(input.id)),
    engagement: publicProcedure.input(contentItemIdInput).query(({ input, ctx }) => getContentEngagement(input.contentItemId, ctx.user?.id)),
    toggleLike: protectedProcedure.input(contentItemIdInput).mutation(({ input, ctx }) => toggleContentLike(input.contentItemId, ctx.user.id)),
    addComment: protectedProcedure.input(z.object({ contentItemId: z.number().int().positive(), body: z.string().trim().min(1).max(1000) }))
      .mutation(({ input, ctx }) => addContentComment(input.contentItemId, ctx.user.id, input.body)),
  }),
  adminAccess: router({
    list: adminProcedure.query(() => listAdminEmailAccess()),
    add: adminProcedure.input(adminEmailInput)
      .mutation(({ input, ctx }) => grantAdminEmailAccess(input.email, ctx.user.id)),
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
