// يمرّر روابط التخزين إلى تطبيق Express نفسه، لأن Vercel لا يطابق المسار العام catch-all في بعض deployments.
import app from "../../server/_generated/vercel-handler.mjs";

export default app;
