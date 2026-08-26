import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  BellRing,
  Camera,
  Edit3,
  ImagePlus,
  Images,
  Link2,
  LogOut,
  MapPinned,
  Megaphone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type CamelForm = {
  recordCode: string;
  name: string;
  imageUrl: string;
  imagePositionX: number;
  imagePositionY: number;
  imageScale: number;
  imageRotation: number;
  shade: string;
  owner: string;
  father: string;
  mother: string;
  maternalSibling: string;
  maternalSiblingLabel: string;
  status: string;
  achievements: string;
  production: string;
  worker: string;
  phone: string;
  note: string;
  isPublished: boolean;
  sortOrder: number;
};

type ContentForm = {
  kind: "news" | "announcement" | "celebration" | "photo" | "video";
  title: string;
  body: string;
  mediaUrl: string;
  mediaKey: string;
  thumbnailUrl: string;
  thumbnailKey: string;
  durationSeconds: number | null;
  camelRecordId: string;
  isPublished: boolean;
  sortOrder: number;
};

type ReserveForm = {
  reserveName: string;
  locationName: string;
  mapUrl: string;
  phone: string;
  veterinaryService: string;
  climateService: string;
  visitHours: string;
  visitDescription: string;
};

const emptyCamel: CamelForm = {
  recordCode: "Z-",
  name: "",
  imageUrl: "",
  imagePositionX: 50,
  imagePositionY: 50,
  imageScale: 100,
  imageRotation: 0,
  shade: "",
  owner: "",
  father: "",
  mother: "",
  maternalSibling: "",
  maternalSiblingLabel: "القرابة",
  status: "قيد اعتماد الإدارة",
  achievements: "",
  production: "",
  worker: "",
  phone: "+971 50 441 9789",
  note: "",
  isPublished: true,
  sortOrder: 0,
};

const emptyContent: ContentForm = {
  kind: "news",
  title: "",
  body: "",
  mediaUrl: "",
  mediaKey: "",
  thumbnailUrl: "",
  thumbnailKey: "",
  durationSeconds: null,
  camelRecordId: "",
  isPublished: true,
  sortOrder: 0,
};

const defaultReserve: ReserveForm = {
  reserveName: "محمية زمول عيسى بن سعيد الخييلي",
  locationName: "ميدان الشيخ سلطان بن زايد للتراث",
  mapUrl: "https://maps.google.com/?q=24.4725890,55.2180330",
  phone: "+971 50 441 9789",
  veterinaryService: "فحص البروسيلا متاح داخل المحمية",
  climateService: "متاح مجاناً دون أي رسوم",
  visitHours: "تُنشر بعد اعتماد إدارة المحمية",
  visitDescription: "تضم المحمية موقعاً ميدانياً في سويحان، ووسيلة مباشرة للتواصل مع المسؤول، إلى جانب خدمة فحص البروسيلا وخدمة المناخ المتاحة مجاناً دون رسوم.",
};

const kindLabels = {
  news: "خبر",
  announcement: "إعلان",
  celebration: "تهنئة أو مناسبة",
  photo: "صورة",
  video: "فيديو",
} as const;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذر قراءة الملف."));
    reader.readAsDataURL(file);
  });
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function readVideoDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    const finish = (duration: number | null) => {
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) ? Math.max(0, Math.round(video.duration)) : null);
    video.onerror = () => finish(null);
    video.src = objectUrl;
  });
}

function createVideoThumbnail(file: File) {
  return new Promise<File | null>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    const finish = (thumbnail: File | null) => {
      URL.revokeObjectURL(objectUrl);
      resolve(thumbnail);
    };
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadedmetadata = () => { video.currentTime = Math.min(Math.max(0.1, video.duration / 2), Math.max(0.1, video.duration - 0.1)); };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const context = canvas.getContext("2d");
      if (!context) { finish(null); return; }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => finish(blob ? new File([blob], `${file.name.replace(/\.[^/.]+$/, "")}-thumbnail.jpg`, { type: "image/jpeg" }) : null), "image/jpeg", 0.86);
    };
    video.onerror = () => finish(null);
    video.src = objectUrl;
  });
}

function AdminContent() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const camelsQuery = trpc.camel.listAll.useQuery();
  const contentQuery = trpc.content.listAll.useQuery();
  const reserveQuery = trpc.reserve.get.useQuery();
  const adminAccessQuery = trpc.adminAccess.list.useQuery();
  const uploadFile = trpc.media.upload.useMutation();
  const createCamel = trpc.camel.create.useMutation();
  const updateCamel = trpc.camel.update.useMutation();
  const removeCamel = trpc.camel.remove.useMutation();
  const createCamelPhoto = trpc.camelPhotos.create.useMutation();
  const removeCamelPhoto = trpc.camelPhotos.remove.useMutation();
  const createCamelProductionLink = trpc.camelProductionLinks.create.useMutation();
  const updateCamelProductionLink = trpc.camelProductionLinks.update.useMutation();
  const removeCamelProductionLink = trpc.camelProductionLinks.remove.useMutation();
  const createContent = trpc.content.create.useMutation();
  const updateContent = trpc.content.update.useMutation();
  const removeContent = trpc.content.remove.useMutation();
  const saveReserveSettings = trpc.reserve.update.useMutation();
  const addAdminEmail = trpc.adminAccess.add.useMutation();
  const removeAdminEmail = trpc.adminAccess.remove.useMutation();

  const [camelForm, setCamelForm] = useState<CamelForm>(emptyCamel);
  const [contentForm, setContentForm] = useState<ContentForm>(emptyContent);
  const [reserveForm, setReserveForm] = useState<ReserveForm>(defaultReserve);
  const [editingCamelId, setEditingCamelId] = useState<number | null>(null);
  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  const [camelGalleryId, setCamelGalleryId] = useState<number | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [message, setMessage] = useState("");
  const [contentMessage, setContentMessage] = useState("");
  const [galleryMessage, setGalleryMessage] = useState("احفظ بطاقة البعير أولاً، ثم أضف لها صوراً إضافية.");
  const [productionLinkUrl, setProductionLinkUrl] = useState("");
  const [productionLinkTitle, setProductionLinkTitle] = useState("");
  const [editingProductionLinkId, setEditingProductionLinkId] = useState<number | null>(null);
  const [productionLinkMessage, setProductionLinkMessage] = useState("اختر البعير ثم الصق رابط إنتاجه واضغط «إضافة الرابط». يُسجل التاريخ تلقائياً.");
  const camelFormRef = useRef<HTMLFormElement>(null);
  const contentFormRef = useRef<HTMLFormElement>(null);

  const camelOptions = useMemo(() => camelsQuery.data ?? [], [camelsQuery.data]);
  const linkedContentCamel = useMemo(() => camelOptions.find((camel) => String(camel.id) === contentForm.camelRecordId) ?? null, [camelOptions, contentForm.camelRecordId]);
  const camelGalleryInput = useMemo(() => ({ camelRecordId: camelGalleryId ?? 1 }), [camelGalleryId]);
  const camelGalleryQuery = trpc.camelPhotos.list.useQuery(camelGalleryInput, { enabled: Boolean(camelGalleryId) });
  const camelProductionLinksInput = useMemo(() => ({ camelRecordId: editingCamelId ?? 1 }), [editingCamelId]);
  const camelProductionLinksQuery = trpc.camelProductionLinks.list.useQuery(camelProductionLinksInput, { enabled: Boolean(editingCamelId) });

  useEffect(() => {
    if (!reserveQuery.data) return;
    setReserveForm({
      reserveName: reserveQuery.data.reserveName,
      locationName: reserveQuery.data.locationName,
      mapUrl: reserveQuery.data.mapUrl,
      phone: reserveQuery.data.phone,
      veterinaryService: reserveQuery.data.veterinaryService,
      climateService: reserveQuery.data.climateService,
      visitHours: reserveQuery.data.visitHours,
      visitDescription: reserveQuery.data.visitDescription,
    });
  }, [reserveQuery.data]);

  if (user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center" dir="rtl">
        <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-amber-700" />
        <h1 className="text-xl font-bold text-stone-900">هذه الصفحة مخصصة لإدارة المحمية</h1>
        <p className="mt-3 text-sm leading-7 text-stone-600">يتطلب الدخول حساب المالك أو حساباً منحته إدارة المحمية صلاحية الإدارة.</p>
      </div>
    );
  }

  const setCamelField = <K extends keyof CamelForm>(key: K, value: CamelForm[K]) =>
    setCamelForm((current) => ({ ...current, [key]: value }));
  const setContentField = <K extends keyof ContentForm>(key: K, value: ContentForm[K]) =>
    setContentForm((current) => ({ ...current, [key]: value }));
  const setReserveField = <K extends keyof ReserveForm>(key: K, value: ReserveForm[K]) =>
    setReserveForm((current) => ({ ...current, [key]: value }));

  const refreshCamels = () => utils.camel.listAll.invalidate();
  const refreshContent = () => utils.content.listAll.invalidate();

  function scrollToForm(element: HTMLFormElement | null) {
    requestAnimationFrame(() => element?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function uploadMedia(event: ChangeEvent<HTMLInputElement>, folder: "camels" | "content", apply: (url: string, key: string) => void | Promise<void>, reportError?: (notice: string) => void, successNotice?: string) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      const notice = "يرجى اختيار ملف بحجم 25 ميغابايت أو أقل.";
      setMessage(notice);
      reportError?.(notice);
      return;
    }
    try {
      setMessage("جارٍ رفع الملف...");
      const uploaded = await uploadFile.mutateAsync({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        dataUrl: await readFileAsDataUrl(file),
        folder,
      });
      await apply(uploaded.url, uploaded.key);
      setMessage(successNotice ?? "تم رفع الملف وربطه بالنموذج.");
    } catch (error) {
      const notice = error instanceof Error ? error.message : "تعذر رفع الملف.";
      setMessage(notice);
      reportError?.(notice);
    } finally {
      event.target.value = "";
    }
  }

  async function uploadContentMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const preserveSelectedKind = contentForm.kind === "announcement" || contentForm.kind === "celebration";
    const durationSeconds = isVideo ? await readVideoDuration(file) : null;
    const thumbnailFile = isVideo ? await createVideoThumbnail(file) : null;
    if (isVideo) {
      if (!preserveSelectedKind) setContentField("kind", "video");
      setContentField("durationSeconds", durationSeconds);
    } else if (file.type.startsWith("image/")) {
      if (!preserveSelectedKind) setContentField("kind", "photo");
      setContentField("durationSeconds", null);
    }
    setContentMessage("جارٍ رفع الملف وربطه بالمحتوى...");
    await uploadMedia(event, "content", async (url, key) => {
      let thumbnailUrl = "";
      let thumbnailKey = "";
      if (thumbnailFile) {
        const uploadedThumbnail = await uploadFile.mutateAsync({ fileName: thumbnailFile.name, contentType: thumbnailFile.type, dataUrl: await readFileAsDataUrl(thumbnailFile), folder: "content" });
        thumbnailUrl = uploadedThumbnail.url;
        thumbnailKey = uploadedThumbnail.key;
      }
      setContentField("mediaUrl", url);
      setContentField("mediaKey", key);
      setContentField("thumbnailUrl", thumbnailUrl);
      setContentField("thumbnailKey", thumbnailKey);
      setContentMessage(durationSeconds !== null ? `تم ربط الفيديو بنجاح. مدته ${formatDuration(durationSeconds)} ويمكنك الآن حفظه أو نشره.` : "تم ربط الملف بنجاح. يمكنك الآن حفظ المحتوى أو نشره.");
    }, (notice) => setContentMessage(`تعذر رفع الملف: ${notice}`));
  }

  async function uploadPrimaryCamelImage(event: ChangeEvent<HTMLInputElement>) {
    await uploadMedia(event, "camels", async (url) => {
      setCamelField("imageUrl", url);
      if (!editingCamelId) return;
      await updateCamel.mutateAsync({ id: editingCamelId, values: { imageUrl: url } });
      await refreshCamels();
    }, undefined, editingCamelId ? "تم حفظ الصورة الرئيسية وظهورها في سجل البعير." : "تم ربط الصورة. اضغط «حفظ بطاقة البعير» لإظهارها في السجل.");
  }

  async function uploadCamelGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!editingCamelId || !camelGalleryId) {
      setGalleryMessage("احفظ بطاقة البعير أولاً، ثم افتح «تعديل» لإضافة صور المعرض.");
      event.target.value = "";
      return;
    }
    const invalidFile = files.find((file) => !file.type.startsWith("image/") || file.size > 25 * 1024 * 1024);
    if (!files.length || invalidFile) {
      setGalleryMessage("اختر صوراً فقط، وبحجم 25 ميغابايت أو أقل لكل صورة.");
      event.target.value = "";
      return;
    }
    try {
      const startOrder = camelGalleryQuery.data?.length ?? 0;
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setGalleryMessage(`جارٍ رفع الصورة ${index + 1} من ${files.length}...`);
        const uploaded = await uploadFile.mutateAsync({ fileName: file.name, contentType: file.type, dataUrl: await readFileAsDataUrl(file), folder: "camels" });
        await createCamelPhoto.mutateAsync({ camelRecordId: editingCamelId, imageUrl: uploaded.url, mediaKey: uploaded.key, sortOrder: startOrder + index });
      }
      await utils.camelPhotos.list.invalidate(camelGalleryInput);
      await utils.camelPhotos.counts.invalidate();
      setGalleryMessage(`تمت إضافة ${files.length} صورة إلى معرض هذا البعير.`);
    } catch (error) {
      setGalleryMessage(error instanceof Error ? error.message : "تعذر رفع صور المعرض. حاول مرة أخرى.");
    } finally {
      event.target.value = "";
    }
  }

  async function saveCamel(event: FormEvent) {
    event.preventDefault();
    try {
      setMessage("جارٍ حفظ بطاقة البعير...");
      const values = { ...camelForm, maternalSibling: camelForm.maternalSibling || null };
      if (editingCamelId) {
        await updateCamel.mutateAsync({ id: editingCamelId, values });
      } else {
        await createCamel.mutateAsync(values);
      }
      await refreshCamels();
      setEditingCamelId(null);
      setCamelForm(emptyCamel);
      setMessage("تم حفظ بطاقة البعير بنجاح.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حفظ بطاقة البعير.");
    }
  }

  async function saveContent(event: FormEvent) {
    event.preventDefault();
    if (!contentForm.title.trim()) {
      setContentMessage("اكتب عنوان الخبر أو الإعلان أولاً ثم اضغط حفظ المحتوى.");
      return;
    }
    if ((contentForm.kind === "photo" || contentForm.kind === "video") && !contentForm.mediaUrl) {
      setContentMessage("اختر صورة أو فيديو وانتظر رسالة «تم ربط الملف بنجاح» قبل الحفظ.");
      return;
    }
    try {
      setMessage("جارٍ حفظ المحتوى...");
      setContentMessage("جارٍ حفظ المحتوى...");
      const values = {
        ...contentForm,
        body: contentForm.body || null,
        mediaUrl: contentForm.mediaUrl || null,
        mediaKey: contentForm.mediaKey || null,
        thumbnailUrl: contentForm.thumbnailUrl || null,
        thumbnailKey: contentForm.thumbnailKey || null,
        durationSeconds: contentForm.durationSeconds,
        camelRecordId: contentForm.camelRecordId ? Number(contentForm.camelRecordId) : null,
        publishedAt: new Date(),
      };
      if (editingContentId) {
        await updateContent.mutateAsync({ id: editingContentId, values });
      } else {
        await createContent.mutateAsync(values);
      }
      await refreshContent();
      setEditingContentId(null);
      setContentForm(emptyContent);
      setMessage("تم حفظ المحتوى بنجاح.");
      setContentMessage("تم حفظ المحتوى بنجاح. ستجده في القائمة المجاورة، ويظهر في الموقع العام عند تفعيل النشر.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حفظ المحتوى.");
      setContentMessage(error instanceof Error ? error.message : "تعذر حفظ المحتوى. تأكد من العنوان والملف ثم أعد المحاولة.");
    }
  }

  async function saveReserve(event: FormEvent) {
    event.preventDefault();
    try {
      setMessage("جارٍ حفظ بيانات المحمية...");
      await saveReserveSettings.mutateAsync(reserveForm);
      await utils.reserve.get.invalidate();
      setMessage("تم حفظ الموقع ورقم التواصل وخدمات المحمية. تظهر التغييرات في الموقع العام.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حفظ بيانات المحمية.");
    }
  }

  async function saveAdminEmail(event: FormEvent) {
    event.preventDefault();
    try {
      setMessage("جارٍ إضافة بريد المسؤول...");
      await addAdminEmail.mutateAsync({ email: adminEmail });
      await utils.adminAccess.list.invalidate();
      setAdminEmail("");
      setMessage("تمت إضافة البريد. سيحصل صاحبه على صلاحية الإدارة تلقائياً عند أول تسجيل دخول.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إضافة بريد المسؤول.");
    }
  }

  async function deleteAdminEmail(email: string) {
    if (!window.confirm(`سحب اعتماد الإدارة عن ${email}؟`)) return;
    try {
      await removeAdminEmail.mutateAsync({ email });
      await utils.adminAccess.list.invalidate();
      setMessage("تم سحب اعتماد الإدارة عن البريد المحدد.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر سحب اعتماد الإدارة.");
    }
  }

  async function deleteCamelGalleryPhoto(photoId: number) {
    if (!window.confirm("حذف هذه الصورة من معرض البعير؟")) return;
    try {
      setGalleryMessage("جارٍ حذف الصورة من المعرض...");
      await removeCamelPhoto.mutateAsync({ id: photoId });
      await utils.camelPhotos.list.invalidate(camelGalleryInput);
      await utils.camelPhotos.counts.invalidate();
      setGalleryMessage("تم حذف الصورة من معرض البعير.");
    } catch (error) {
      setGalleryMessage(error instanceof Error ? error.message : "تعذر حذف الصورة من المعرض.");
    }
  }

  async function addCamelProductionLink() {
    if (!editingCamelId) {
      setProductionLinkMessage("احفظ بطاقة البعير أولاً، ثم اختر «إضافة إنتاج» لإدراج رابط له.");
      return;
    }
    if (!productionLinkUrl.trim()) {
      setProductionLinkMessage("الصق رابط الإنتاج أولاً ثم اضغط «إضافة الرابط».");
      return;
    }
    if (!productionLinkTitle.trim()) {
      setProductionLinkMessage("اكتب اسم الإنتاج واسم المالك كما يظهران في المنصة الأصلية.");
      return;
    }
    try {
      setProductionLinkMessage(editingProductionLinkId ? "جارٍ حفظ تعديل الرابط..." : "جارٍ حفظ رابط الإنتاج...");
      if (editingProductionLinkId) {
        await updateCamelProductionLink.mutateAsync({ id: editingProductionLinkId, values: { title: productionLinkTitle.trim(), url: productionLinkUrl.trim() } });
      } else {
        await createCamelProductionLink.mutateAsync({ camelRecordId: editingCamelId, title: productionLinkTitle.trim(), url: productionLinkUrl.trim() });
      }
      await utils.camelProductionLinks.list.invalidate(camelProductionLinksInput);
      setProductionLinkUrl("");
      setProductionLinkTitle("");
      setEditingProductionLinkId(null);
      setProductionLinkMessage(editingProductionLinkId ? "تم حفظ تعديل رابط الإنتاج." : "تمت إضافة رابط الإنتاج وحفظ تاريخ ربطه تلقائياً.");
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "تعذر إضافة الرابط.";
      setProductionLinkMessage(rawMessage.toLowerCase().includes("duplicate") ? "هذا الرابط مضاف مسبقاً إلى سجل إنتاج البعير." : rawMessage);
    }
  }

  async function deleteCamelProductionLink(linkId: number) {
    if (!window.confirm("حذف رابط الإنتاج هذا من سجل البعير؟")) return;
    try {
      setProductionLinkMessage("جارٍ حذف رابط الإنتاج...");
      await removeCamelProductionLink.mutateAsync({ id: linkId });
      await utils.camelProductionLinks.list.invalidate(camelProductionLinksInput);
      if (editingProductionLinkId === linkId) {
        setEditingProductionLinkId(null);
        setProductionLinkUrl("");
        setProductionLinkTitle("");
      }
      setProductionLinkMessage("تم حذف رابط الإنتاج من سجل البعير.");
    } catch (error) {
      setProductionLinkMessage(error instanceof Error ? error.message : "تعذر حذف رابط الإنتاج.");
    }
  }

  async function deleteContentItem(item: NonNullable<typeof contentQuery.data>[number]) {
    const kind = kindLabels[item.kind];
    if (!window.confirm(`حذف ${kind} «${item.title}»؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      setContentMessage(`جارٍ حذف ${kind}...`);
      await removeContent.mutateAsync({ id: item.id });
      await refreshContent();
      if (editingContentId === item.id) {
        setEditingContentId(null);
        setContentForm(emptyContent);
      }
      setMessage(`تم حذف ${kind} بنجاح.`);
      setContentMessage(`تم حذف ${kind} «${item.title}» من لوحة الإدارة والموقع العام.`);
    } catch (error) {
      const notice = error instanceof Error ? error.message : `تعذر حذف ${kind}.`;
      setMessage(notice);
      setContentMessage(notice);
    }
  }

  function editCamel(camel: NonNullable<typeof camelsQuery.data>[number]) {
    setEditingCamelId(camel.id);
    setCamelGalleryId(camel.id);
    setGalleryMessage("يمكنك الآن اختيار عدة صور للبعير؛ تُضاف كل صورة تلقائياً إلى المعرض.");
    setProductionLinkUrl("");
    setProductionLinkTitle("");
    setEditingProductionLinkId(null);
    setProductionLinkMessage(`الصق رابط إنتاج ${camel.name} ثم اضغط «إضافة الرابط». يُسجل التاريخ تلقائياً.`);
    setCamelForm({
      recordCode: camel.recordCode,
      name: camel.name,
      imageUrl: camel.imageUrl,
      imagePositionX: camel.imagePositionX ?? 50,
      imagePositionY: camel.imagePositionY ?? 50,
      imageScale: camel.imageScale ?? 100,
      imageRotation: camel.imageRotation ?? 0,
      shade: camel.shade,
      owner: camel.owner,
      father: camel.father,
      mother: camel.mother,
      maternalSibling: camel.maternalSibling ?? "",
      maternalSiblingLabel: camel.maternalSiblingLabel,
      status: camel.status,
      achievements: camel.achievements,
      production: camel.production,
      worker: camel.worker,
      phone: camel.phone,
      note: camel.note,
      isPublished: camel.isPublished,
      sortOrder: camel.sortOrder,
    });
    setMessage(`تم تحميل بطاقة ${camel.name}. عدّل البيانات ثم اضغط حفظ تعديلات البعير.`);
    scrollToForm(camelFormRef.current);
  }

  function editContent(item: NonNullable<typeof contentQuery.data>[number]) {
    setEditingContentId(item.id);
    setContentForm({
      kind: item.kind,
      title: item.title,
      body: item.body ?? "",
      mediaUrl: item.mediaUrl ?? "",
      mediaKey: item.mediaKey ?? "",
      thumbnailUrl: item.thumbnailUrl ?? "",
      thumbnailKey: item.thumbnailKey ?? "",
      durationSeconds: item.durationSeconds ?? null,
      camelRecordId: item.camelRecordId ? String(item.camelRecordId) : "",
      isPublished: item.isPublished,
      sortOrder: item.sortOrder,
    });
    setMessage(`تم تحميل ${kindLabels[item.kind]} «${item.title}». عدّل البيانات ثم اضغط حفظ تعديلات المحتوى.`);
    scrollToForm(contentFormRef.current);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12" dir="rtl">
      <header className="rounded-[2rem] bg-gradient-to-l from-stone-900 via-stone-800 to-amber-950 px-7 py-8 text-white shadow-2xl shadow-stone-300">
        <p className="text-xs font-bold tracking-[0.2em] text-amber-300">إدارة محمية زمول عيسى بن سعيد الخييلي</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-black">لوحة إدارة المحمية</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-300">أضف زمولاً جديداً، حدّث الإنتاج والإنجازات، وانشر الأخبار والإعلانات والصور والفيديوهات من مكان واحد.</p>
          </div>
          <a href="/" className="rounded-full border border-amber-300/50 px-5 py-2 text-sm font-bold text-amber-100 transition hover:bg-white/10">عرض الموقع العام</a>
        </div>
      </header>

      {message && <div role="status" aria-live="polite" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-900">{message}</div>}

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={saveReserve} className="scroll-mt-20 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3"><MapPinned className="h-5 w-5 text-amber-700" /><div><h2 className="text-xl font-black text-stone-900">بيانات المحمية</h2><p className="mt-1 text-xs leading-5 text-stone-500">عدّل الموقع ورقم التواصل والخدمات، ثم احفظها لتظهر في الموقع العام.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="اسم المحمية" value={reserveForm.reserveName} onChange={(value) => setReserveField("reserveName", value)} required />
            <Field label="موقع المحمية" value={reserveForm.locationName} onChange={(value) => setReserveField("locationName", value)} required />
            <Field label="رابط الخريطة" value={reserveForm.mapUrl} onChange={(value) => setReserveField("mapUrl", value)} required />
            <Field label="رقم التواصل" value={reserveForm.phone} onChange={(value) => setReserveField("phone", value)} required />
            <Field label="فحص البروسيلا أو الخدمة البيطرية" value={reserveForm.veterinaryService} onChange={(value) => setReserveField("veterinaryService", value)} required />
            <Field label="خدمة المناخ" value={reserveForm.climateService} onChange={(value) => setReserveField("climateService", value)} required />
            <Field label="أوقات الزيارة" value={reserveForm.visitHours} onChange={(value) => setReserveField("visitHours", value)} required />
          </div>
          <div className="mt-4"><TextField label="وصف الزيارة والتواصل" value={reserveForm.visitDescription} onChange={(value) => setReserveField("visitDescription", value)} required /></div>
          <Button type="submit" disabled={saveReserveSettings.isPending} className="mt-6 w-full bg-amber-700 hover:bg-amber-800"><Save className="ml-2 h-4 w-4" />حفظ بيانات المحمية</Button>
        </form>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3"><UsersRound className="h-5 w-5 text-amber-700" /><div><h2 className="text-xl font-black text-stone-900">إضافة مسؤول</h2><p className="mt-1 text-xs leading-5 text-stone-500">أدخل البريد فقط؛ تتفعل الإدارة لصاحب البريد عند أول تسجيل دخول.</p></div></div>
          <form onSubmit={saveAdminEmail} className="flex flex-col gap-3 sm:flex-row">
            <input required type="email" dir="ltr" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="name@example.com" className="h-11 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100" />
            <Button type="submit" disabled={addAdminEmail.isPending} className="h-11 bg-amber-700 hover:bg-amber-800"><UserRoundPlus className="ml-2 h-4 w-4" />إضافة مسؤول</Button>
          </form>
          <div className="mt-5 space-y-2">
            {adminAccessQuery.isLoading && <p className="text-sm text-stone-500">جارٍ تحميل المسؤولين المعتمدين...</p>}
            {adminAccessQuery.data?.map((access) => <div key={access.id} className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3"><p dir="ltr" className="min-w-0 truncate text-sm font-bold text-stone-800">{access.email}</p>{access.email === user?.email?.trim().toLowerCase() ? <span className="shrink-0 text-xs font-bold text-stone-500">حسابك الحالي</span> : <Button type="button" size="sm" variant="ghost" disabled={removeAdminEmail.isPending} className="shrink-0 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => deleteAdminEmail(access.email)}>سحب الإدارة</Button>}</div>)}
            {!adminAccessQuery.isLoading && adminAccessQuery.data?.length === 0 && <p className="rounded-2xl border border-dashed border-stone-200 p-4 text-sm text-stone-500">لم تُضف أي رسائل بريد لمسؤولين إضافيين بعد.</p>}
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <form ref={camelFormRef} onSubmit={saveCamel} className="scroll-mt-20 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><Camera className="h-5 w-5 text-amber-700" /><h2 className="text-xl font-black text-stone-900">{editingCamelId ? "تعديل بطاقة بعير" : "إضافة بعير جديد"}</h2></div>
            {editingCamelId && <Button type="button" variant="outline" onClick={() => { setEditingCamelId(null); setCamelGalleryId(null); setCamelForm(emptyCamel); setMessage("تم إلغاء التعديل. يمكنك الآن إضافة بعير جديد."); }}>إلغاء التعديل</Button>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="رقم السجل" value={camelForm.recordCode} onChange={(value) => setCamelField("recordCode", value)} required />
            <Field label="اسم البعير" value={camelForm.name} onChange={(value) => setCamelField("name", value)} required />
            <Field label="الأب" value={camelForm.father} onChange={(value) => setCamelField("father", value)} required />
            <Field label="الأم" value={camelForm.mother} onChange={(value) => setCamelField("mother", value)} required />
            <Field label="اللون" value={camelForm.shade} onChange={(value) => setCamelField("shade", value)} required />
            <Field label="الجهة أو المالك" value={camelForm.owner} onChange={(value) => setCamelField("owner", value)} required />
            <Field label="عنوان القرابة" value={camelForm.maternalSiblingLabel} onChange={(value) => setCamelField("maternalSiblingLabel", value)} required />
            <Field label="بيانات القرابة" value={camelForm.maternalSibling} onChange={(value) => setCamelField("maternalSibling", value)} />
            <Field label="العامل المسؤول" value={camelForm.worker} onChange={(value) => setCamelField("worker", value)} required />
            <Field label="رقم التواصل" value={camelForm.phone} onChange={(value) => setCamelField("phone", value)} required />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextField label="الإنجازات" value={camelForm.achievements} onChange={(value) => setCamelField("achievements", value)} required />
            <TextField label="الإنتاج" value={camelForm.production} onChange={(value) => setCamelField("production", value)} required />
            <TextField label="حالة التوثيق" value={camelForm.status} onChange={(value) => setCamelField("status", value)} required />
            <TextField label="نبذة السجل" value={camelForm.note} onChange={(value) => setCamelField("note", value)} required />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm font-bold text-stone-700">صورة البعير (حتى 25 ميغابايت)<input className="mt-2 block w-full text-xs" type="file" accept="image/*" onChange={uploadPrimaryCamelImage} />{camelForm.imageUrl && <span className="mt-2 block truncate text-xs text-emerald-700">{editingCamelId ? "تم حفظ الصورة في سجل البعير" : "تم ربط الصورة"}</span>}</label>
            <div className="space-y-3 rounded-2xl bg-stone-50 p-4"><Field label="ترتيب الظهور" type="number" value={String(camelForm.sortOrder)} onChange={(value) => setCamelField("sortOrder", Number(value) || 0)} required /><CheckField label="عرض البطاقة في الموقع" checked={camelForm.isPublished} onChange={(checked) => setCamelField("isPublished", checked)} /></div>
          </div>
          {camelForm.imageUrl && <section className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4"><div className="flex items-start gap-3"><Camera className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h3 className="font-black text-stone-900">ضبط صورة البطاقة</h3><p className="mt-1 text-xs leading-6 text-stone-600">حرّك الصورة وكبّرها أو دوّرها حتى يظهر البعير بالشكل المناسب داخل الإطار. ثم اضغط حفظ تعديلات البعير.</p></div></div><div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]"><div className="relative h-52 overflow-hidden rounded-xl bg-[#e9ddc8]"><img src={camelForm.imageUrl} alt={`معاينة ${camelForm.name || "البعير"}`} className="h-full w-full object-cover" style={{ objectPosition: `${camelForm.imagePositionX}% ${camelForm.imagePositionY}%`, transform: `scale(${camelForm.imageScale / 100}) rotate(${camelForm.imageRotation}deg)`, transformOrigin: "center" }} /></div><div className="grid content-start gap-4"><label className="grid gap-2 text-xs font-black text-stone-700">تحريك أفقي: {camelForm.imagePositionX}%<input type="range" min="0" max="100" value={camelForm.imagePositionX} onChange={(event) => setCamelField("imagePositionX", Number(event.target.value))} /></label><label className="grid gap-2 text-xs font-black text-stone-700">تحريك رأسي: {camelForm.imagePositionY}%<input type="range" min="0" max="100" value={camelForm.imagePositionY} onChange={(event) => setCamelField("imagePositionY", Number(event.target.value))} /></label><label className="grid gap-2 text-xs font-black text-stone-700">تكبير الصورة: {camelForm.imageScale}%<input type="range" min="100" max="180" value={camelForm.imageScale} onChange={(event) => setCamelField("imageScale", Number(event.target.value))} /></label><label className="grid gap-2 text-xs font-black text-stone-700">تدوير الصورة: {camelForm.imageRotation}°<input type="range" min="-180" max="180" value={camelForm.imageRotation} onChange={(event) => setCamelField("imageRotation", Number(event.target.value))} /></label><Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => { setCamelField("imagePositionX", 50); setCamelField("imagePositionY", 50); setCamelField("imageScale", 100); setCamelField("imageRotation", 0); }}>إعادة ضبط الصورة</Button></div></div></section>}
          <section className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
            <div className="flex items-start gap-3"><Images className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" /><div><h3 className="font-black text-stone-900">معرض صور البعير</h3><p className="mt-1 text-xs leading-6 text-stone-600">الصورة أعلاه هي الصورة الرئيسية للبطاقة. أضف هنا صوراً إضافية تظهر عند فتح سجل البعير في الموقع العام.</p></div></div>
            {editingCamelId ? <><label className="mt-4 block rounded-xl border border-dashed border-violet-300 bg-white p-3 text-sm font-bold text-violet-900">اختيار عدة صور (حتى 25 ميغابايت للصورة)<input className="mt-2 block w-full text-xs" type="file" accept="image/*" multiple disabled={uploadFile.isPending || createCamelPhoto.isPending} onChange={uploadCamelGallery} /></label><p role="status" aria-live="polite" className="mt-3 text-xs font-bold leading-6 text-violet-900">{galleryMessage}</p><div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">{camelGalleryQuery.data?.map((photo) => <div key={photo.id} className="overflow-hidden rounded-xl border border-violet-100 bg-white"><img className="h-20 w-full object-cover" src={photo.imageUrl} alt={`صورة إضافية لـ ${camelForm.name}`} /><Button type="button" size="sm" className="min-h-10 w-full rounded-none bg-red-700 text-xs text-white hover:bg-red-800" disabled={removeCamelPhoto.isPending} onClick={() => deleteCamelGalleryPhoto(photo.id)}><Trash2 className="ml-1 h-3.5 w-3.5" />حذف الصورة</Button></div>)}</div>{!camelGalleryQuery.isLoading && camelGalleryQuery.data?.length === 0 && <p className="mt-3 text-xs text-stone-500">لا توجد صور إضافية بعد؛ استخدم الحقل أعلاه لإضافة صور متعددة دفعة واحدة.</p>}</> : <p className="mt-4 rounded-xl bg-white px-3 py-3 text-xs leading-6 text-stone-600">بعد حفظ بطاقة البعير، اضغط «تعديل» من قائمة السجلات لإضافة صوره الإضافية في مكان واحد.</p>}
          </section>
          <section className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
            <div className="flex items-start gap-3"><Link2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><div><h3 className="font-black text-stone-900">روابط إنتاج البعير</h3><p className="mt-1 text-xs leading-6 text-stone-600">اكتب اسم الإنتاج واسم المالك كما يظهران في المنصة، ثم الصق الرابط واضغط الإضافة. يمكن إضافة أي عدد من الروابط، ويُحفظ تاريخ الربط تلقائياً.</p></div></div>
            {editingCamelId ? <><div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)_auto_auto]"><label className="grid gap-2 text-sm font-bold text-stone-700"><span>عنوان الإنتاج</span><input value={productionLinkTitle} onChange={(event) => setProductionLinkTitle(event.target.value)} placeholder="مثال: السريع لعمير بالحزمي" className="h-12 rounded-xl border border-sky-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label><label className="grid gap-2 text-sm font-bold text-stone-700"><span>رابط الإنتاج</span><input dir="ltr" inputMode="url" type="url" value={productionLinkUrl} onChange={(event) => setProductionLinkUrl(event.target.value)} placeholder="https://www.youtube.com/..." className="h-12 rounded-xl border border-sky-200 bg-white px-3 text-left text-sm font-medium outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label><Button type="button" onClick={() => void addCamelProductionLink()} disabled={createCamelProductionLink.isPending || updateCamelProductionLink.isPending} className="min-h-12 self-end bg-sky-700 hover:bg-sky-800"><Plus className="ml-2 h-4 w-4" />{createCamelProductionLink.isPending || updateCamelProductionLink.isPending ? "جارٍ الحفظ" : editingProductionLinkId ? "حفظ التعديل" : "إضافة الرابط"}</Button>{editingProductionLinkId && <Button type="button" variant="outline" className="min-h-12 self-end" onClick={() => { setEditingProductionLinkId(null); setProductionLinkUrl(""); setProductionLinkTitle(""); setProductionLinkMessage("أُلغي التعديل. الصق رابطاً جديداً أو اختر رابطاً لتعديله."); }}>إلغاء</Button>}</div><p role="status" aria-live="polite" className="mt-3 text-xs font-bold leading-6 text-sky-950">{productionLinkMessage}</p><div className="mt-4 space-y-2">{camelProductionLinksQuery.data?.map((link, index) => <article key={link.id} className="flex flex-col gap-3 rounded-xl border border-sky-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-black text-stone-900">{index + 1}. {link.title}</p><p className="mt-1 text-xs font-bold text-sky-800">{link.platform}</p><a href={link.url} target="_blank" rel="noreferrer" dir="ltr" className="mt-1 block truncate text-xs font-bold text-sky-800 underline underline-offset-4">{link.url}</a><p className="mt-1 text-[11px] font-medium text-stone-500">تاريخ الربط: {new Date(link.linkedAt).toLocaleDateString("ar-AE", { year: "numeric", month: "long", day: "numeric" })}</p></div><div className="flex gap-2"><Button type="button" size="sm" variant="outline" className="min-h-10 shrink-0 border-sky-300 text-sky-800 hover:bg-sky-50" onClick={() => { setEditingProductionLinkId(link.id); setProductionLinkTitle(link.title); setProductionLinkUrl(link.url); setProductionLinkMessage("عدّل العنوان أو الرابط في الحقلين أعلاه ثم اضغط «حفظ التعديل»."); }}><Edit3 className="ml-1 h-4 w-4" />تعديل</Button><Button type="button" size="sm" className="min-h-10 shrink-0 bg-red-700 text-white hover:bg-red-800" disabled={removeCamelProductionLink.isPending} onClick={() => deleteCamelProductionLink(link.id)}><Trash2 className="ml-1 h-4 w-4" />حذف الرابط</Button></div></article>)}</div>{!camelProductionLinksQuery.isLoading && camelProductionLinksQuery.data?.length === 0 && <p className="mt-3 rounded-xl bg-white px-3 py-3 text-xs leading-6 text-stone-600">لا توجد روابط إنتاج مضافة بعد. اكتب عنوان الإنتاج ثم ألصق أول رابط أعلاه.</p>}</> : <p className="mt-4 rounded-xl bg-white px-3 py-3 text-xs leading-6 text-stone-600">احفظ بطاقة البعير أولاً، ثم اضغط «تعديل» أو «إضافة إنتاج» من قائمة السجلات لإضافة عنوان وروابط إنتاجه.</p>}
          </section>
          <Button type="submit" disabled={createCamel.isPending || updateCamel.isPending || !camelForm.imageUrl} className="mt-6 w-full bg-amber-700 hover:bg-amber-800"><Save className="ml-2 h-4 w-4" />{editingCamelId ? "حفظ تعديلات البعير" : "حفظ بطاقة البعير"}</Button>
        </form>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3"><Edit3 className="h-5 w-5 text-amber-700" /><h2 className="text-xl font-black text-stone-900">السجلات الحالية</h2></div>
          <div className="max-h-[900px] space-y-3 overflow-y-auto pl-1">
            {camelsQuery.isLoading && <p className="text-sm text-stone-500">جارٍ تحميل السجلات...</p>}
            {camelOptions.map((camel) => <article key={camel.id} className="rounded-2xl border border-stone-100 p-4"><div className="flex items-center gap-3"><img className="h-14 w-14 rounded-xl object-cover" src={camel.imageUrl} alt={camel.name} /><div className="min-w-0 flex-1"><p className="text-xs font-bold text-amber-700">{camel.recordCode}</p><h3 className="truncate font-black text-stone-900">{camel.name}</h3><p className="mt-1 line-clamp-1 text-xs text-stone-500">الإنتاج: {camel.production}</p></div></div><div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" className="min-h-10" onClick={() => editCamel(camel)}>تعديل</Button><Button type="button" size="sm" className="min-h-10 bg-sky-700 text-white hover:bg-sky-800" onClick={() => editCamel(camel)}><Link2 className="ml-1 h-4 w-4" />إضافة إنتاج</Button><Button type="button" size="sm" variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={async () => { if (!window.confirm(`حذف بطاقة ${camel.name}؟`)) return; await removeCamel.mutateAsync({ id: camel.id }); await refreshCamels(); }}> <Trash2 className="ml-1 h-4 w-4" />حذف</Button></div></article>)}
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form ref={contentFormRef} onSubmit={saveContent} className="scroll-mt-20 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Megaphone className="h-5 w-5 text-amber-700" /><h2 className="text-xl font-black text-stone-900">{editingContentId ? "تعديل المحتوى" : "إضافة خبر أو إعلان أو وسائط"}</h2></div>{editingContentId && <Button type="button" variant="outline" onClick={() => { setEditingContentId(null); setContentForm(emptyContent); setMessage("تم إلغاء تعديل المحتوى."); }}>إلغاء</Button>}</div>
          <div className="space-y-4">
            <label className="grid gap-2 text-sm font-bold text-stone-700">نوع المحتوى<select className="h-11 rounded-xl border border-stone-200 bg-white px-3" value={contentForm.kind} onChange={(event) => setContentField("kind", event.target.value as ContentForm["kind"])}>{Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <Field label="العنوان" value={contentForm.title} onChange={(value) => setContentField("title", value)} />
            <TextField label={contentForm.kind === "video" ? "وصف فيديو الإنتاج أو نتيجة الشوط" : "النص أو التفاصيل"} value={contentForm.body} onChange={(value) => setContentField("body", value)} />
            <label className="grid gap-2 text-sm font-bold text-stone-700">ربط خبر إنتاج أو تحديث ببعير (اختياري)<select className="h-11 rounded-xl border border-stone-200 bg-white px-3" value={contentForm.camelRecordId} onChange={(event) => setContentField("camelRecordId", event.target.value)}><option value="">محتوى عام للمحمية</option>{camelOptions.map((camel) => <option key={camel.id} value={camel.id}>{camel.name}</option>)}</select><span className="text-[11px] font-medium leading-5 text-stone-500">عند اختيار بعير، يظهر الخبر تحت سجله. وإذا كان نوع المحتوى «صورة»، تُضاف الصورة أيضاً تلقائياً إلى معرض البعير بعد الحفظ.</span></label>
            {contentForm.kind === "video" && linkedContentCamel && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-xs leading-6 text-violet-950"><p className="font-black">سيُوثق هذا الفيديو تلقائياً في سجل إنتاج {linkedContentCamel.name}</p><div className="mt-2 grid gap-1 sm:grid-cols-3"><span>البعير: <strong>{linkedContentCamel.name}</strong></span><span>الأب: <strong>{linkedContentCamel.father}</strong></span><span>الأم: <strong>{linkedContentCamel.mother}</strong></span></div><p className="mt-2 text-violet-800">بيانات الإنتاج المعروضة: {linkedContentCamel.production}</p><p className="mt-1 text-violet-800">ويظهر أسفل الفيديو: «من إنتاج {linkedContentCamel.name}» مع بيانات النسب المحفوظة في السجل.</p></div>}
            <label className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm font-bold text-stone-700">صورة أو فيديو (حتى 25 ميغابايت)<input className="mt-2 block w-full text-xs" type="file" accept="image/*,video/*" onChange={uploadContentMedia} />{contentForm.mediaUrl && <span className="mt-2 block text-xs text-emerald-700">تم ربط الملف بالنشر</span>}<span className="mt-2 block text-[11px] font-medium leading-5 text-stone-500">عند اختيار «إعلان» أو «تهنئة»، يبقى النوع كما هو وتُربط به الصورة أو الفيديو. في الأنواع الأخرى يحدد الملف النوع تلقائياً.</span></label>
            <div className="grid gap-4 md:grid-cols-2"><Field label="ترتيب الظهور" type="number" value={String(contentForm.sortOrder)} onChange={(value) => setContentField("sortOrder", Number(value) || 0)} required /><CheckField label="نشر المحتوى فوراً" checked={contentForm.isPublished} onChange={(checked) => setContentField("isPublished", checked)} /></div>
          </div>
          <div role="status" aria-live="polite" className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-900">{contentMessage || "اكتب العنوان أولاً. الصورة والفيديو مطلوبان فقط عند اختيار نوع «صورة» أو «فيديو»."}</div>
          <Button type="submit" disabled={createContent.isPending || updateContent.isPending || uploadFile.isPending} className="mt-4 w-full bg-amber-700 hover:bg-amber-800"><Plus className="ml-2 h-4 w-4" />{uploadFile.isPending ? "جارٍ رفع الملف..." : editingContentId ? "حفظ تعديلات المحتوى" : "حفظ المحتوى"}</Button>
        </form>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><BellRing className="h-5 w-5 text-amber-700" /><h2 className="text-xl font-black text-stone-900">الأخبار والوسائط والإعلانات</h2></div><span className="text-xs font-bold text-stone-500">{contentQuery.data?.length ?? 0} عنصر</span></div>
          <div className="grid gap-3 md:grid-cols-2">
            {contentQuery.isLoading && <p className="text-sm text-stone-500">جارٍ تحميل المحتوى...</p>}
            {contentQuery.data?.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-stone-100">{item.mediaUrl && (item.kind === "video" || item.durationSeconds !== null ? <video className="h-36 w-full object-cover" src={item.mediaUrl} controls /> : <img className="h-36 w-full object-cover" src={item.mediaUrl} alt={item.title} />)}<div className="p-4"><div className="mb-2 flex items-center justify-between"><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">{kindLabels[item.kind]}</span>{item.isPublished ? <span className="text-[10px] font-bold text-emerald-700">منشور</span> : <span className="text-[10px] font-bold text-stone-500">مسودة</span>}</div><h3 className="font-black text-stone-900">{item.title}</h3>{item.body && <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-600">{item.body}</p>}<div className="mt-4 grid grid-cols-2 gap-2"><Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => editContent(item)}>تعديل</Button><Button type="button" size="sm" className="min-h-11 bg-red-700 text-white hover:bg-red-800" disabled={removeContent.isPending} onClick={() => deleteContentItem(item)}><Trash2 className="ml-1 h-4 w-4" />حذف {kindLabels[item.kind]}</Button></div></div></article>)}
            {!contentQuery.isLoading && contentQuery.data?.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-stone-200 p-10 text-center text-sm text-stone-500"><ImagePlus className="mx-auto mb-3 h-8 w-8 text-amber-700" />لا توجد أخبار أو إعلانات أو وسائط بعد.</div>}
          </div>
        </section>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <label className="grid gap-2 text-sm font-bold text-stone-700">{label}<input required={required} type={type} className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextField({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-bold text-stone-700">{label}<textarea required={required} className="min-h-24 resize-y rounded-xl border border-stone-200 bg-white p-3 text-sm font-medium outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex h-11 items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold text-stone-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

export default function Admin() {
  const { loading, user } = useAuth();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.assign("/"),
  });

  if (loading) {
    return <div className="min-h-screen bg-stone-50" aria-busy="true" />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-5" dir="rtl">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-amber-700" />
          <h1 className="text-xl font-black text-stone-900">سجّل الدخول لإدارة المحمية</h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">تحتاج إلى حساب مسؤول لإضافة الزمول وتعديلها ونشر المحتوى.</p>
          <Button type="button" onClick={startLogin} className="mt-6 w-full bg-amber-700 hover:bg-amber-800">تسجيل الدخول</Button>
          <a href="/" className="mt-4 inline-block text-sm font-bold text-amber-800 underline-offset-4 hover:underline">العودة إلى الموقع العام</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" dir="rtl">
      <header className="sticky top-0 z-50 flex min-h-14 items-center justify-between gap-3 border-b border-stone-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
        <a href="/" className="rounded-xl px-3 py-2 text-sm font-black text-amber-800 transition hover:bg-amber-50">الموقع العام</a>
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 text-left"><p className="truncate text-xs font-bold text-stone-700">{user.email ?? user.name ?? "حساب الإدارة"}</p><p className="text-[10px] font-bold text-emerald-700">إدارة المحمية</p></div>
          <Button type="button" size="sm" variant="outline" disabled={logout.isPending} onClick={() => logout.mutate()} className="min-h-10 shrink-0 border-stone-300 bg-white px-3 text-xs font-black text-stone-700 hover:bg-stone-100 hover:text-stone-950"><LogOut className="ml-1 h-4 w-4" />{logout.isPending ? "جارٍ الخروج" : "تسجيل الخروج"}</Button>
        </div>
      </header>
      <main className="relative z-0 touch-manipulation p-4"><AdminContent /></main>
    </div>
  );
}
