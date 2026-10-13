# ملاحظات ربط قاعدة البيانات مع Vercel

يستخدم المشروع الحالي Drizzle مع محرك MySQL/TiDB عبر متغير البيئة `DATABASE_URL`. يوصى باستخدام **TiDB Cloud** لأنه متوافق مع MySQL ويوفر تكاملاً مع Vercel.

بعد إنشاء كتلة TiDB Cloud وربطها بمشروع Vercel، يجب إضافة متغير البيئة التالي في إعدادات Vercel:

```text
DATABASE_URL=mysql://<User>:<Password>@<Endpoint>:<Port>/<Database>?sslaccept=strict
```

لا يوضع هذا الرابط داخل ملفات الكود أو GitHub؛ يضاف فقط إلى متغيرات البيئة في Vercel. يلزم لاحقاً تطبيق ترحيلات Drizzle ثم نقل بيانات المحمية إلى القاعدة الجديدة.

المصدر: https://docs.pingcap.com/tidbcloud/integrate-tidbcloud-with-vercel/
