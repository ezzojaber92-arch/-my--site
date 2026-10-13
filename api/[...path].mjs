// تستخدم كل مسارات API العامة حزمة الخادم التي أنشأها أمر البناء.
// الامتداد الصريح ضروري لمشغل ESM في دوال Vercel.
import app from "../server/_generated/vercel-handler.mjs";

export default app;
