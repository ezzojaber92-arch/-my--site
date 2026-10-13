// تستخدم نقطة tRPC الحزمة نفسها كي تبقى جميع خدمات API في بيئة تشغيل واحدة.
import app from "../../server/_generated/vercel-handler.mjs";

export default app;
