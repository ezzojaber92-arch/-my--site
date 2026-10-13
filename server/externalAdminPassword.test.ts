import { describe, expect, it } from "vitest";
import { hashAdminAccountPassword, verifyAdminAccountPassword } from "./externalAdminAuth";

describe("external admin account passwords", () => {
  it("يخزن كلمة المرور كتجزئة غير قابلة للقراءة ويقبل الكلمة الصحيحة فقط", async () => {
    const password = "secure-admin-password";
    const hash = await hashAdminAccountPassword(password);

    expect(hash).toMatch(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    expect(hash).not.toContain(password);
    await expect(verifyAdminAccountPassword(password, hash)).resolves.toBe(true);
    await expect(verifyAdminAccountPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("يرفض كلمة المرور الأقصر من ثمانية أحرف", async () => {
    await expect(hashAdminAccountPassword("short")).rejects.toThrow("ADMIN_ACCOUNT_PASSWORD_TOO_SHORT");
  });
});
