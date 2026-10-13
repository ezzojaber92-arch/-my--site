/**
 * مدخل خادم مخصص لـ Vercel. يُحوَّل هذا الملف إلى وحدة ESM مكتفية ذاتياً
 * قبل أن يجمع Vercel دوال `api/`، حتى لا تعتمد الدوال على استيرادات TypeScript
 * نسبية لا يحلها مشغل Node في بيئة الدالة.
 */
import { createApp } from "./_core/app";

export default createApp();
