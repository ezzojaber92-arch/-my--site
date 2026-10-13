/**
 * سجل الإبل الموحد لمحمية زمول الشيخ طحنون بن محمد طيب الله ثراه.
 *
 * لإضافة بعير جديد: انسخ camelRecordTemplate في نهاية هذه القائمة، ثم اعتمد
 * رقم السجل والاسم والصورة وبقية البيانات. لتحديث الإنتاج أو الإنجازات أو
 * النسب أو التواصل، عدّل الحقل المقابل في بطاقة البعير نفسها فقط.
 */

export type CamelRecord = {
  id: string;
  name: string;
  image: string;
  imagePositionX?: number;
  imagePositionY?: number;
  imageScale?: number;
  imageRotation?: number;
  shade: string;
  owner: string;
  father: string;
  mother: string;
  maternalBrother: string;
  maternalSiblingLabel: string;
  status: string;
  achievements: string;
  production: string;
  worker: string;
  phone: string;
  subscriptionUrl?: string | null;
  achievementsUrl?: string | null;
  note: string;
};

export const camelRecordTemplate: CamelRecord = {
  id: "Z-000",
  name: "اسم البعير",
  image: "/manus-storage/ضع-رابط-الصورة-هنا.jpg",
  shade: "لون البعير",
  owner: "الجهة أو المالك",
  father: "اسم الأب",
  mother: "اسم الأم",
  maternalBrother: "بيانات القرابة",
  maternalSiblingLabel: "القرابة",
  status: "حالة التوثيق",
  achievements: "أضف الإنجازات المعتمدة",
  production: "أضف بيانات الإنتاج المحدثة",
  worker: "اسم العامل المسؤول",
  phone: "+971 50 441 9789",
  note: "نبذة توثيقية عن البعير.",
};

export const camelRecords: CamelRecord[] = [
  {
    id: "Z-001",
    name: "راهي ولد السريعة",
    image: "/manus-storage/rahi-weld-alsareea_68f66fcf.png",
    shade: "لم تُعتمد صفة اللون في السجل بعد",
    owner: "غير مسجل في البطاقة",
    father: "راهي الشيبة",
    mother: "السريعة",
    maternalBrother: "لم يُوثق في السجل بعد",
    maternalSiblingLabel: "الأخ من الأم",
    status: "بيانات النسب والإنجاز موثقة في سجل المحمية",
    achievements: "6 سيارات",
    production: "له العديد من الإنتاج والرموز",
    worker: "يُعرض اسم المسؤول بعد اعتماد إدارة المحمية",
    phone: "+971 50 441 9789",
    note: "راهي ولد السريعة، من الأب راهي الشيبة والأم السريعة. يوثق السجل إنجازاته وإنتاجه ضمن بيانات المحمية.",
  },
  {
    id: "Z-002",
    name: "الحذر الصغير",
    image: "/manus-storage/alhathar-alsagheer_c8c1ed8e.png",
    shade: "لم تُعتمد صفة اللون في السجل بعد",
    owner: "غير مسجل في البطاقة",
    father: "الدرع بن منانة",
    mother: "الظبية بنت سراب الشيبة",
    maternalBrother: "شاهين المهيري — بعير مختبر الإمارات",
    maternalSiblingLabel: "الأخ من الأم",
    status: "بيانات النسب والإنجاز موثقة في سجل المحمية",
    achievements: "رمز، وثاني على الرمز، وثالث على الرمز، ورابع على الرمز، وخامس على الرمز، وسيارات",
    production: "لم تُسجل بيانات الإنتاج في البطاقة بعد",
    worker: "يُعرض اسم المسؤول بعد اعتماد إدارة المحمية",
    phone: "+971 50 441 9789",
    note: "الحذر الصغير من الأب الدرع بن منانة والأم الظبية بنت سراب الشيبة. أخوه من الأم شاهين المهيري، بعير مختبر الإمارات.",
  },
  {
    id: "Z-004",
    name: "عناد",
    image: "/manus-storage/enad_b3b0ae58.png",
    shade: "لم تُعتمد صفة اللون في السجل بعد",
    owner: "غير مسجل في البطاقة",
    father: "الشهم بن مرخان",
    mother: "بن شاهين",
    maternalBrother: "الوسمية — ناقة بالدليوي",
    maternalSiblingLabel: "الأخت من الأم",
    status: "بيانات النسب والإنجاز موثقة في سجل المحمية",
    achievements: "في رصيده سيارات",
    production: "لم تُسجل بيانات الإنتاج في البطاقة بعد",
    worker: "يُعرض اسم المسؤول بعد اعتماد إدارة المحمية",
    phone: "+971 50 441 9789",
    note: "عناد من الأب الشهم بن مرخان والأم بن شاهين. أخته من الأم الوسمية، وهي ناقة بالدليوي، وله رصيد من السيارات.",
  },
  {
    id: "Z-005",
    name: "مرضي",
    image: "/manus-storage/mardhi_138a6354.png",
    shade: "لم تُعتمد صفة اللون في السجل بعد",
    owner: "غير مسجل في البطاقة",
    father: "مناور الشيبة",
    mother: "السريعة",
    maternalBrother: "مرضية الرئاسة، ومناور أخو مرضية — بعير العاصفة",
    maternalSiblingLabel: "الأشقاء من الأب والأم",
    status: "بيانات النسب والإنجاز موثقة في سجل المحمية",
    achievements: "ثاني على السيارة، وعدة سبقات",
    production: "لم تُسجل بيانات الإنتاج في البطاقة بعد",
    worker: "يُعرض اسم المسؤول بعد اعتماد إدارة المحمية",
    phone: "+971 50 441 9789",
    note: "مرضي من الأب مناور الشيبة والأم السريعة. أشقاؤه من الأب والأم: مرضية الرئاسة، ومناور أخو مرضية بعير العاصفة. من إنجازاته المركز الثاني على السيارة وعدة سبقات.",
  },
  {
    id: "Z-006",
    name: "الوسمى الصغير",
    image: "/manus-storage/alwasmi-alsagheer_04572c54.png",
    shade: "لم تُعتمد صفة اللون في السجل بعد",
    owner: "بعير حياة الشيخ طحنون بن محمد",
    father: "الوسمي الشيبة",
    mother: "سرابة بنت سراب الشيبة",
    maternalBrother: "لم تُسجل بيانات الإخوة في البطاقة بعد",
    maternalSiblingLabel: "القرابة",
    status: "بيانات الحياة والنسب والإنتاج موثقة في سجل المحمية",
    achievements: "غير مركض",
    production: "له العديد من الإنتاج",
    worker: "يُعرض اسم المسؤول بعد اعتماد إدارة المحمية",
    phone: "+971 50 441 9789",
    note: "الوسمى الصغير بعير حياة الشيخ طحنون بن محمد، من الأب الوسمي الشيبة والأم سرابة بنت سراب الشيبة. له العديد من الإنتاج، وحالته في سجل الإنجاز: غير مركض.",
  },
  {
    id: "Z-007",
    name: "غازي ولد وفرة",
    image: "/manus-storage/ghazi-weld-wafra_02cb9f56.png",
    shade: "لم تُعتمد صفة اللون في السجل بعد",
    owner: "بعير حياة الشيخ طحنون بن محمد",
    father: "غازي المختبر",
    mother: "وفرة بنت خديدات",
    maternalBrother: "لم تُسجل بيانات الإخوة في البطاقة بعد",
    maternalSiblingLabel: "القرابة",
    status: "بيانات الحياة والنسب والإنجاز موثقة في سجل المحمية",
    achievements: "ثاني على السيارة، وعدة سبقات",
    production: "لم تُسجل بيانات الإنتاج في البطاقة بعد",
    worker: "يُعرض اسم المسؤول بعد اعتماد إدارة المحمية",
    phone: "+971 50 441 9789",
    note: "غازي ولد وفرة بعير حياة الشيخ طحنون بن محمد، من الأب غازي المختبر والأم وفرة بنت خديدات. من إنجازاته المركز الثاني على السيارة وعدة سبقات.",
  },
];
