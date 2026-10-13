import { randomUUID } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { hasExternalAdminSession, externalAdminSessionEmail, externalAdminUser } from "../externalAdminAuth";
import { sdk } from "./sdk";

export const VISITOR_TOKEN_COOKIE = "zomool_visitor_token";
const VISITOR_TOKEN_MAX_AGE = 60 * 60 * 24 * 365;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  visitorToken?: string;
};

export function getOrSetVisitorToken(req: CreateExpressContextOptions["req"], res: CreateExpressContextOptions["res"]) {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  const existing = cookies[VISITOR_TOKEN_COOKIE];
  const visitorToken = existing && /^[a-zA-Z0-9_-]{16,64}$/.test(existing) ? existing : randomUUID();
  if (visitorToken !== existing) {
    const secure = process.env.NODE_ENV === "production" || req.protocol === "https" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${VISITOR_TOKEN_COOKIE}=${encodeURIComponent(visitorToken)}; Max-Age=${VISITOR_TOKEN_MAX_AGE}; Path=/; SameSite=Lax; HttpOnly${secure}`);
  }
  return visitorToken;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  if (await hasExternalAdminSession(opts.req)) {
    user = externalAdminUser(await externalAdminSessionEmail(opts.req));
  } else try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    visitorToken: getOrSetVisitorToken(opts.req, opts.res),
  };
}
