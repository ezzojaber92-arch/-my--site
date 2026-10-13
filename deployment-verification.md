# تحقق من رابط Vercel المستخدم

بتاريخ 2026-08-29 تم فحص `https://zomoolreserve.vercel.app/` مباشرة. المتصفح وجد بطاقة البعير، لكن القيم الفعلية كانت قديمة: `bodyFont` و`cardFont` هما `"Noto Kufi Arabic", sans-serif`، وزن البطاقة 400، والإطار `1.33333px solid rgba(115, 85, 61, 0.11)`، كما لم يوجد وسم `meta[name="color-scheme"]`. ملف CSS المحمّل كان `assets/index-BmWkl18f.css`. لذلك عدم ظهور التغيير سببه أن نطاق Vercel الذي فتحه المستخدم لم يتزامن مع آخر نسخة Manus، وليس أن قاعدة CSS الجديدة غير موجودة في المشروع الحالي.

## تحقق بعد النشر المباشر

بعد نشر `dpl_8xx7kjEyX2ugZzUQpdhBTcRWf8Lk` إلى مشروع `zomool-al-khaili-reserve-vercel-production-controls`، أصبح النطاق `https://zomoolreserve.vercel.app/` يحمل CSS جديداً `assets/index-B9GsxYnk.css`. القيَم الفعلية في المتصفح: `bodyFont` و`cardFont` هما `Cairo, sans-serif`، وزن البطاقة `700`، وزن العنوان `800`، والإطار `1.33333px solid rgba(91, 63, 43, 0.22)`، و`colorScheme` هو `light`. النطاق المختصر أصبح يخدم التغيير المطلوب.

## تحقق خط Noto والظل

بعد نشر الإصدار الجديد إلى `zomoolreserve.vercel.app`، أكد المتصفح أن `bodyFont` و`cardFont` هما `"Noto Kufi Arabic", sans-serif`، وزن البطاقة `700`، ووزن عنوان الواجهة `800`، ووزن فقرة الصورة الرئيسية `700`. كما ظهر ظل البطاقة فعلياً بالقيم `0 16px 34px rgba(59,41,28,.16), 0 4px 10px rgba(59,41,28,.08)`، وبقي الإطار البني `rgba(91,63,43,.22)` و`color-scheme: light`.

## تحقق من تقوية الخط

بعد نشر الإصدار `dpl_FkJyQtMBeq8V4B58RUaeXxMUizuB` إلى `zomoolreserve.vercel.app`، أكد المتصفح أن خط بطاقة البعير هو `Noto Kufi Arabic` بوزن البطاقة `800`، ووزن قيم البيانات `800` مع `-webkit-text-stroke: 0.12px`. كما تأكد وزن عنوان البطاقة ووزن النص فوق صورة الشمس عند `800`، وبقي الوضع موحّداً على `color-scheme: light`.

## تحقق سجل البعير المفتوح

بعد نشر الإصدار `dpl_FQyF9ZvmEHvB82uJppxyKMDv935c`، فتح الرابط `/?camel=Z-004#herd` سجل عناد مباشرة على `zomoolreserve.vercel.app`. أكد المتصفح أن نص السجل يستخدم `Noto Kufi Arabic`: حاوية السجل بوزن 700، الوصف بوزن 700 مع `text-stroke: 0.08px`، قيم الحقول بوزن 800 مع `text-stroke: 0.12px`، والعنوان بوزن 900. هذا يطابق التعديل المطلوب لزيادة وضوح النص على الهاتف.

## تحقق نشر Vercel الأخير

تم نشر الحزمة الحالية مباشرة إلى مشروع Vercel Production في النشر `dpl_9XX3yU22425ZJgH74uhvvsh9xJiH`، وأصبح النطاق `zomoolreserve.vercel.app` أحد الـ aliases بحالة `READY`. أكد المتصفح في النطاق الإنتاجي أن بطاقة البعير تستخدم `Noto Kufi Arabic` بوزن 800، وإطاراً بنياً شفافاً، وظلاً طبقيّاً واضحاً، وأن `color-scheme` بقي `light`.

## تثبيت النشر الإنتاجي على Vercel

تم التحقق من آخر نشر في مشروع Vercel `zomool-al-khaili-reserve-vercel-production-controls`: النشر `dpl_9XX3yU22425ZJgH74uhvvsh9xJiH` بحالة `READY` وهدفه `production`، والنطاق `zomoolreserve.vercel.app` مرتبط به كـ alias. سيُستخدم هذا النطاق الإنتاجي الثابت للتسليم، بينما تُعامل روابط Vercel الأخرى الخاصة بمعاينة الإصدار أو تفاصيله كروابط فحص داخلية وليست رابط الموقع للمستخدم.

## تحقق تباين الإعلان

بعد نشر النشر `dpl_CQqSQXkp79oZuM8ZDp1LCMjHHVC2` إلى `zomoolreserve.vercel.app`، أكد المتصفح أن عنوان الإعلان المتحرك أصبح باللون `rgb(67, 43, 32)` ووزن 800، وأن نصه باللون `rgb(91, 64, 46)` ووزن 800. بقي زر الشريط بلونه الفاتح على الخلفية البنفسجية، دون تغيير وظيفة الإعلان أو حركته.

## تحقق رابط الشعار بعد النشر

بعد نشر `dpl_BYsD4VWix6TWCyzF46WJ3CwVFUZU` إلى `zomoolreserve.vercel.app`، أكد المتصفح أن شعار المحمية يحمل `href="/"` ووسم وصول يوضح العودة إلى الصفحة الرئيسية. كما بقي الإعلان المتحرك باللونين البنيين الداكنين ووزن 800، وبقي `color-scheme` في الوضع الفاتح.

## تحقق التحديث الفوري لكود البعير

بعد نشر `dpl_Cd8LNxn22m1djLxnYXDvrwvZnoBU` ثم `dpl_4DXt5Qrs3aZCbN6LA63tfeFB4Nct` إلى Vercel Production، يعيد رابط `https://zomoolreserve.vercel.app/?camel=Z-004#herd` حالة HTTP 200. كما يعيد استعلام `camel.listPublic` رؤوس `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` و`CDN-Cache-Control: no-store`. الواجهة تعيد جلب السجل والصور والروابط عند فتح QR، وتستبدل السجل الاحتياطي بالسجل القادم من قاعدة البيانات عند وصول أي حقل محدث.

## تحقق استمرارية Vercel

في 2026-08-31 تم فحص مشروع Vercel `zomool-al-khaili-reserve-vercel-production-controls`: النشر `dpl_Cd8LNxn22m1djLxnYXDvrwvZnoBU` حالته `READY` وهدفه `production`، والـ alias `zomoolreserve.vercel.app` مرتبط به. أعاد الرابط المختصر HTTP 200 من خارج لوحة Vercel. هذا يثبت أنه رابط إنتاج ثابت وليس Preview مؤقتاً؛ استمرار الخدمة يظل مرتبطاً ببقاء مشروع Vercel وحسابه وخدمات TiDB/Blob مفعّلة وعدم تجاوز سياسات المزود.

## تحقق معاينة المشاركة بدون شعار — 2026-09-03

نُشر الإصدار `dpl_AZh6Zaxh3VT5Z2r3j4czNR2YV1er` إلى مشروع Vercel Production. النطاق `https://zomoolreserve.vercel.app` مرتبط بالنشر وحالته `READY`. أظهر HTML الحي `og:title` و`og:description` و`og:type` و`twitter:card=summary` فقط، ولم يظهر `og:image` أو `twitter:image` أو `summary_large_image` أو `rel="icon"`. كما أعادت الاستجابة `cache-control: public, max-age=0, must-revalidate` و`x-vercel-cache: MISS` وقت الفحص.

## تحقق فصل فيديو المحمية — 2026-09-04

بعد نشر `dpl_9yhTHTiqV7HAbhxEUYRrZ8bmtqab` إلى Vercel Production، أظهر الرابط `https://zomoolreserve.vercel.app/?video-placement=9yhTHTiqV7HAbhxEUYRrZ8bmtqab` قسم «فيديوهات المحمية» بعنوان «لقطات من الميدان» وبطاقة «المحمية 2026» في الصفحة الرئيسية. وعند فتح `/?camel=Z-004#herd` ظهر سجل البعير بمواد البعير الخاصة فقط داخل نافذته، من دون إدراج فيديو المحمية العام داخل السجل؛ بقاء بطاقة الفيديو في عناصر الصفحة الخلفية طبيعي لأن النافذة مفتوحة فوق الصفحة الرئيسية.
