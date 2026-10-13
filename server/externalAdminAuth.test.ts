import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";

function makeContext() {
  return {
    req: {
      headers: {},
      protocol: "https",
      secure: true,
      get: vi.fn((name: string) => name === "x-forwarded-proto" ? "https" : undefined),
    } as any,
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
    user: null,
  };
}

describe("external admin authentication", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-admin-password-123");
    vi.stubEnv("JWT_SECRET", "test-jwt-secret-for-admin-session-32");
  });

  it("accepts the configured password through the public login API and sets an httpOnly session cookie", async () => {
    const context = makeContext();
    const caller = appRouter.createCaller(context);

    const result = await caller.auth.login({ password: "test-admin-password-123" });

    expect(result).toEqual({ success: true });
    expect(context.res.cookie).toHaveBeenCalledTimes(1);
    expect(context.res.cookie.mock.calls[0]?.[1]).toEqual(expect.any(String));
    expect(context.res.cookie.mock.calls[0]?.[2]).toEqual(expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60 * 1000,
    }));
  });

  it("can sign a session with the admin password when no separate JWT secret is present", async () => {
    vi.stubEnv("JWT_SECRET", "");
    const context = makeContext();
    const caller = appRouter.createCaller(context);

    const result = await caller.auth.login({ password: "test-admin-password-123" });

    expect(result).toEqual({ success: true });
    expect(context.res.cookie).toHaveBeenCalledTimes(1);
  });

  it("rejects an incorrect password without setting a session cookie", async () => {
    const context = makeContext();
    const caller = appRouter.createCaller(context);

    await expect(caller.auth.login({ password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(context.res.cookie).not.toHaveBeenCalled();
  });
});
