/**
 * إرث الرمال: صفحة تحريرية عربية فاخرة تستخدم البني الإسبريسو والرمل الهادئ،
 * صوراً كبيرة، وحوافاً دقيقة لإبراز سجل الإبل والمعلومات الميدانية.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  Heart,
  Images,
  Instagram,
  Ghost,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  QrCode,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/_core/hooks/useAuth";
import { camelRecords, type CamelRecord } from "@/data/camelRecords";
import { publishedContentFallback } from "@/data/publishedContent";
import { productionLinksFallback } from "@/data/productionLinksFallback";
import { imageAdjustmentKey, imageAdjustmentStyle, type ImageAdjustments } from "@/lib/imageAdjustments";
import { isDeletedLegacyCamelPhoto } from "@/lib/camelGallery";
import { isCelebrationActive } from "@/lib/celebrationTiming";
import { getCyclicGalleryIndex } from "@/lib/galleryNavigation";
import { formatPhoneNumber, phoneLink, whatsappLink } from "@/lib/phone";
import { publicMediaUrl } from "@/lib/publicMediaUrl";
import { downloadQrPdf, downloadQrSvg } from "@/lib/qrDownload";
import { replaceBrowserHistory } from "@/lib/safeHistory";
import { trpc } from "@/lib/trpc";

const defaultReserve = {
  reserveName: "محمية زمول الشيخ طحنون بن محمد طيب الله ثراه",
  locationName: "ميدان الشيخ سلطان بن زايد للتراث",
  mapUrl: "https://maps.google.com/?q=24.4725890,55.2180330",
  phone: "+971 50 441 9789",
  veterinaryService: "فحص البروسيلا متاح داخل المحمية",
  climateService: "متاح مجاناً دون أي رسوم",
  visitHours: "تُنشر بعد اعتماد إدارة المحمية",
  visitDescription: "تضم المحمية موقعاً ميدانياً في سويحان، ووسيلة مباشرة للتواصل مع المسؤول، إلى جانب خدمة فحص البروسيلا وخدمة المناخ المتاحة مجاناً دون رسوم.",
};

const FALLBACK_SITE_URL = "https://zomoolreserv-9qm89e3w.manus.space";

type PublicContentItem = {
  id: number;
  kind: "news" | "announcement" | "celebration" | "photo" | "video";
  title: string;
  body: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  camelRecordId: number | null;
  likeCount: number;
  publishedAt: Date | string;
};

type ProductionFilter = "all" | "photo" | "video" | "news";

function formatPublishedAt(value: Date | string) {
  return new Intl.DateTimeFormat("ar-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  }).format(new Date(value));
}

function formatLinkDate(value: Date | string) {
  return new Intl.DateTimeFormat("ar-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Dubai",
  }).format(new Date(value));
}

function formatPhotoCount(count: number) {
  if (count === 1) return "صورة واحدة";
  if (count === 2) return "صورتان";
  return `${count} صور`;
}
function formatCamelCardPhotoLabel() {
  return "صور البعير";
}

function formatMediaDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function hasUsableVideoThumbnail(thumbnailUrl: string | null) {
  return Boolean(thumbnailUrl && !thumbnailUrl.includes("/manus-storage/"));
}

type TouchPointList = {
  length: number;
  [index: number]: { clientX: number; clientY: number } | undefined;
};

function getTouchDistance(touches: TouchPointList) {
  const first = touches[0];
  const second = touches[1];
  if (!first || !second) return 0;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

const CAMEL_SWIPE_DURATION_MS = 220;

function clampCamelZoom(value: number) {
  return Math.min(3, Math.max(1, value));
}

function clampCamelPan(value: number, zoom: number) {
  const limit = Math.max(0, (zoom - 1) * 170);
  return Math.min(limit, Math.max(-limit, value));
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span />
      <p>{children}</p>
    </div>
  );
}

function normalizeCamelCode(code: string) {
  const normalized = code.trim().toUpperCase();
  const match = /^Z-(\d+)$/.exec(normalized);
  return match ? `Z-${Number(match[1])}` : normalized;
}
function getInitialSharedCamel() {
  // عند فتح رابط camel ننتظر بيانات الخادم أولاً حتى لا يظهر سجل راهي أو أي سجل افتراضي.
  return null;
}

export default function Home() {
  const { user } = useAuth();
  const [selectedCamel, setSelectedCamel] = useState<(CamelRecord & { databaseId?: number }) | null>(() => getInitialSharedCamel());
  const [selectedContent, setSelectedContent] = useState<PublicContentItem | null>(null);
  const [contentOpenedFromSharedUrl, setContentOpenedFromSharedUrl] = useState(false);
  const contentScrollYRef = useRef<number | null>(null);
  const [isOpeningSharedContent, setIsOpeningSharedContent] = useState(() => typeof window !== "undefined" && Boolean(new URLSearchParams(window.location.search).get("post")));
  const [galleryInput, setGalleryInput] = useState({ camelRecordId: 1 });
  const [contentEngagementInput, setContentEngagementInput] = useState({ contentItemId: 1 });
  const [activeCamelImage, setActiveCamelImage] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [contentActionMessage, setContentActionMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("شارك رابط المحمية");
  const [qrStatus, setQrStatus] = useState("");
  const [productionFilter, setProductionFilter] = useState<ProductionFilter>("all");
  const [camelImageZoom, setCamelImageZoom] = useState(1);
  const [camelImagePan, setCamelImagePan] = useState({ x: 0, y: 0 });
  const [mediaCacheKey] = useState(() => Date.now().toString(36));
  const camelImageSwipeStartX = useRef<number | null>(null);
  const camelPinchStartDistance = useRef<number | null>(null);
  const camelPinchStartZoom = useRef(1);
  const camelPanStart = useRef<{ x: number; y: number; pointerX: number; pointerY: number } | null>(null);
  const camelWasPinching = useRef(false);
  const [camelSwipeOffset, setCamelSwipeOffset] = useState(0);
  const [camelSwipeTransition, setCamelSwipeTransition] = useState(false);
  const camelGalleryRef = useRef<HTMLDivElement | null>(null);
  const camelSwipeAnimationTimer = useRef<number | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const favicon = document.querySelector<HTMLLinkElement>("#site-favicon");
    const heroWide = publicMediaUrl("/manus-storage/zomool-desert-hero-new-camel_f986bb79.png");
    const heroNarrow = publicMediaUrl("/manus-storage/zomool-hero-user-camel-prominent_4eec01bd.png");
    const faviconUrl = publicMediaUrl("/manus-storage/zomool-mark_69b1a465.png");
    if (heroWide) root.style.setProperty("--zomool-hero-wide", `url(\"${heroWide}\")`);
    if (heroNarrow) root.style.setProperty("--zomool-hero-narrow", `url(\"${heroNarrow}\")`);
    if (heroNarrow) root.style.setProperty("--zomool-visit", `url(\"${heroNarrow}\")`);
    if (favicon && faviconUrl) favicon.href = faviconUrl;
    return () => {
      root.style.removeProperty("--zomool-hero-wide");
      root.style.removeProperty("--zomool-hero-narrow");
      root.style.removeProperty("--zomool-visit");
    };
  }, []);
  const freshQueryOptions = { staleTime: 0, gcTime: 0, refetchOnMount: "always" as const, refetchOnWindowFocus: true };
  const hasSharedCamelLink = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("camel");
  const publicCamels = trpc.camel.listPublic.useQuery(undefined, freshQueryOptions);
  const publicContent = trpc.content.listPublic.useQuery(undefined, { ...freshQueryOptions, enabled: !hasSharedCamelLink || Boolean(selectedCamel) });
  const publicReserve = trpc.reserve.getPublic.useQuery(undefined, { ...freshQueryOptions, enabled: !hasSharedCamelLink || Boolean(selectedCamel) });
  const selectedCamelPhotos = trpc.camelPhotos.list.useQuery(galleryInput, { ...freshQueryOptions, enabled: Boolean(selectedCamel?.databaseId) });
  const selectedCamelProductionLinksInput = useMemo(() => ({ camelRecordId: selectedCamel?.databaseId ?? 1 }), [selectedCamel?.databaseId]);
  const selectedCamelProductionLinks = trpc.camelProductionLinks.list.useQuery(selectedCamelProductionLinksInput, { ...freshQueryOptions, enabled: Boolean(selectedCamel?.databaseId) });
  const selectedContentEngagement = trpc.content.engagement.useQuery(contentEngagementInput, { enabled: Boolean(selectedContent) });
  const toggleContentLike = trpc.content.toggleLike.useMutation();
  const addContentComment = trpc.content.addComment.useMutation();
  const utils = trpc.useUtils();
  const reserve = publicReserve.data ?? defaultReserve;
  useEffect(() => {
    const reserveTitle = reserve.reserveName || defaultReserve.reserveName;
    const title = selectedCamel ? selectedCamel.name : reserveTitle;
    const description = selectedCamel
      ? `السجل الرقمي للبعير ${selectedCamel.name} في ${reserveTitle} — النسب والإنجازات والإنتاج وبيانات التواصل.`
      : `السجل الرقمي للإبل والخدمات ووسائل التواصل في ${reserveTitle}.`;
    document.title = title;
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
      document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", description);
    }
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
      document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", title);
    }
  }, [reserve.reserveName, selectedCamel]);
  const camels: (CamelRecord & { databaseId?: number })[] = publicCamels.data
    ? publicCamels.data.map((camel) => ({
        id: camel.recordCode,
        databaseId: camel.id,
        name: camel.name,
        image: publicMediaUrl(camel.imageUrl) ?? "",
        imagePositionX: camel.imagePositionX,
        imagePositionY: camel.imagePositionY,
        imageScale: camel.imageScale,
        imageRotation: camel.imageRotation,
        shade: camel.shade,
        owner: camel.owner,
        father: camel.father,
        mother: camel.mother,
        maternalBrother: camel.maternalSibling ?? "لا توجد بيانات قرابة مضافة",
        maternalSiblingLabel: camel.maternalSiblingLabel,
        status: camel.status,
        achievements: camel.achievements,
        production: camel.production,
        worker: camel.worker,
        phone: camel.phone,
        subscriptionUrl: camel.subscriptionUrl ?? null,
        achievementsUrl: camel.achievementsUrl ?? null,
        note: camel.note,
      }))
    : camelRecords.map((camel) => ({ ...camel, image: publicMediaUrl(camel.image) ?? "" }));
  const selectedCamelImages = useMemo(() => {
    if (!selectedCamel) return [];
    const databaseImages = selectedCamelPhotos.isFetchedAfterMount && !selectedCamelPhotos.isFetching
      ? selectedCamelPhotos.data
        ?.filter((photo) => !isDeletedLegacyCamelPhoto(photo))
        .map((photo) => publicMediaUrl(photo.imageUrl) ?? "") ?? []
      : [];
    // لا نضيف صوراً ثابتة احتياطية هنا؛ صور الكود يجب أن تطابق ما هو محفوظ حالياً في الإدارة فقط.
    return Array.from(new Set([selectedCamel.image, ...databaseImages].filter(Boolean)));
  }, [selectedCamel, selectedCamelPhotos.data, selectedCamelPhotos.isFetchedAfterMount, selectedCamelPhotos.isFetching]);
  const selectedCamelImageAdjustments = useMemo(() => {
    const adjustments = new Map<string, ImageAdjustments>();
    if (!selectedCamel) return adjustments;
    adjustments.set(imageAdjustmentKey(selectedCamel.image), selectedCamel);
    if (!selectedCamelPhotos.isFetchedAfterMount || selectedCamelPhotos.isFetching) return adjustments;
    selectedCamelPhotos.data?.filter((photo) => !isDeletedLegacyCamelPhoto(photo)).forEach((photo) => {
      const imageUrl = publicMediaUrl(photo.imageUrl);
      const key = imageUrl ? imageAdjustmentKey(imageUrl) : "";
      if (key && !adjustments.has(key)) adjustments.set(key, photo);
    });
    return adjustments;
  }, [selectedCamel, selectedCamelPhotos.data, selectedCamelPhotos.isFetchedAfterMount, selectedCamelPhotos.isFetching]);
  const cacheBustedMedia = (url: string) => `${url}${url.includes("?") ? "&" : "?"}v=${mediaCacheKey}`;
  const contentItems = useMemo(() => {
    const sourceItems = publicContent.data && publicContent.data.length > 0 ? publicContent.data : publishedContentFallback;
    return sourceItems.map((item) => ({ ...item, mediaUrl: publicMediaUrl(item.mediaUrl), thumbnailUrl: publicMediaUrl(item.thumbnailUrl) }));
  }, [publicContent.data]);
  const selectedCamelProductionPosts = useMemo(() => selectedCamel?.databaseId ? contentItems.filter((item) => item.camelRecordId === selectedCamel.databaseId) : [], [contentItems, selectedCamel]);
  const reserveVideoItems = useMemo(() => contentItems.filter((item) => item.kind === "video" && item.camelRecordId === null), [contentItems]);
  const selectedCamelProductionLinksFallback = selectedCamel ? productionLinksFallback[selectedCamel.id] ?? [] : [];
  const selectedCamelProductionLinkItems = selectedCamelProductionLinks.data ?? selectedCamelProductionLinksFallback;
  const filteredCamelProductionPosts = useMemo(() => selectedCamelProductionPosts.filter((item) => productionFilter === "all" || productionFilter === "news" ? (productionFilter === "all" || item.kind === "news" || item.kind === "announcement" || item.kind === "celebration") : item.kind === productionFilter), [productionFilter, selectedCamelProductionPosts]);
  const celebrationItems = useMemo(() => contentItems.filter((item) => item.kind === "celebration").sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()), [contentItems]);
  const activeCelebration = useMemo(() => celebrationItems.find((item) => isCelebrationActive(item.publishedAt, Date.now())) ?? null, [celebrationItems]);
  const latestAnnouncement = useMemo(() => contentItems.filter((item) => item.kind === "announcement").sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0] ?? null, [contentItems]);
  const fieldUpdates = useMemo(() => contentItems.filter((item) => item.kind !== "announcement" && item.kind !== "celebration" && !(item.kind === "video" && item.camelRecordId === null)), [contentItems]);

  const closeMenu = () => setIsMenuOpen(false);
  const getSiteUrl = () => typeof window === "undefined" ? FALLBACK_SITE_URL : window.location.origin;
  const getReserveUrl = () => getSiteUrl();
  const getCamelPath = (camel: CamelRecord & { databaseId?: number }, imageIndex = 0) => `/?camel=${encodeURIComponent(camel.id)}${imageIndex > 0 ? `&image=${imageIndex}` : ""}#herd`;
  const getCamelUrl = (camel: CamelRecord & { databaseId?: number }) => `${getSiteUrl()}${getCamelPath(camel)}`;
  const resetCamelImageTransform = () => {
    setCamelImageZoom(1);
    setCamelImagePan({ x: 0, y: 0 });
    camelPinchStartDistance.current = null;
    camelPanStart.current = null;
    camelWasPinching.current = false;
  };
  const changeCamelImageZoom = (delta: number) => {
    const nextZoom = clampCamelZoom(Number((camelImageZoom + delta).toFixed(2)));
    setCamelImageZoom(nextZoom);
    setCamelImagePan((current) => nextZoom === 1 ? { x: 0, y: 0 } : {
      x: clampCamelPan(current.x, nextZoom),
      y: clampCamelPan(current.y, nextZoom),
    });
  };
  const getContentUrl = (item: PublicContentItem) => {
    const url = new URL(window.location.href);
    url.searchParams.set("post", String(item.id));
    return url.toString();
  };
  // مشاركة الفيديو تفتح بطاقة تفاصيله داخل المحمية، لا ملف الوسائط وحده.
  const getContentShareUrl = (item: PublicContentItem) => getContentUrl(item);
  const getProductionUrl = (item: PublicContentItem) => `${getSiteUrl()}/?post=${item.id}`;
  const closeContent = () => {
    const shouldReturnToReserveTop = contentOpenedFromSharedUrl;
    const restoreScrollY = contentScrollYRef.current;
    contentScrollYRef.current = null;
    setSelectedContent(null);
    setContentOpenedFromSharedUrl(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("post");
    replaceBrowserHistory(url.toString());
    requestAnimationFrame(() => {
      if (shouldReturnToReserveTop) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } else if (restoreScrollY !== null) {
        window.scrollTo({ top: restoreScrollY, left: 0, behavior: "auto" });
      }
    });
  };
  const closeCamel = () => {
    const camelIdToRestore = selectedCamel?.id;
    cancelCamelSwipeMotion();
    setSelectedCamel(null);
    setActiveCamelImage(null);
    resetCamelImageTransform();
    const url = new URL(window.location.href);
    url.searchParams.delete("camel");
    url.searchParams.delete("image");
    replaceBrowserHistory(url.toString());
    requestAnimationFrame(() => {
      const target = camelIdToRestore
        ? document.getElementById(`camel-card-${camelIdToRestore}`)
        : document.getElementById("herd");
      target?.scrollIntoView({ behavior: "auto", block: "center" });
    });
  };
  const cancelCamelSwipeMotion = () => {
    if (camelSwipeAnimationTimer.current !== null) {
      window.clearTimeout(camelSwipeAnimationTimer.current);
      camelSwipeAnimationTimer.current = null;
    }
    setCamelSwipeTransition(false);
    setCamelSwipeOffset(0);
  };
  const selectCamelGalleryImage = (imageIndex: number) => {
    if (!selectedCamel || !selectedCamelImages[imageIndex]) return;
    cancelCamelSwipeMotion();
    setActiveCamelImage(selectedCamelImages[imageIndex]);
    resetCamelImageTransform();
    replaceBrowserHistory(getCamelPath(selectedCamel, imageIndex));
  };
  const moveCamelGalleryImage = (direction: 1 | -1) => {
    if (selectedCamelImages.length < 2) return;
    cancelCamelSwipeMotion();
    const currentImage = activeCamelImage ?? selectedCamel?.image;
    const currentIndex = Math.max(0, selectedCamelImages.indexOf(currentImage ?? ""));
    const nextIndex = getCyclicGalleryIndex(currentIndex, selectedCamelImages.length, direction);
    if (nextIndex === -1) return;
    const width = camelGalleryRef.current?.clientWidth ?? 360;
    const travel = direction === 1 ? -1 : 1;
    setCamelSwipeTransition(true);
    setCamelSwipeOffset(travel * width);
    if (camelSwipeAnimationTimer.current !== null) window.clearTimeout(camelSwipeAnimationTimer.current);
    camelSwipeAnimationTimer.current = window.setTimeout(() => {
      selectCamelGalleryImage(nextIndex);
      window.requestAnimationFrame(() => {
        setCamelSwipeTransition(false);
        setCamelSwipeOffset(0);
      });
      camelSwipeAnimationTimer.current = null;
    }, CAMEL_SWIPE_DURATION_MS);
  };
  const openCamel = (camel: CamelRecord & { databaseId?: number }) => {
    setSelectedCamel(camel);
    setActiveCamelImage(camel.image);
    resetCamelImageTransform();
    setProductionFilter("all");
    if (camel.databaseId) setGalleryInput({ camelRecordId: camel.databaseId });
    replaceBrowserHistory(getCamelPath(camel));
  };
  const openContent = (item: PublicContentItem) => {
    contentScrollYRef.current = window.scrollY;
    setContentOpenedFromSharedUrl(false);
    setSelectedContent(item);
    setContentEngagementInput({ contentItemId: item.id });
    setCommentBody("");
    setContentActionMessage("");
    replaceBrowserHistory(getContentUrl(item));
  };
  const shareContentItem = async (item: PublicContentItem) => {
    const url = getContentShareUrl(item);
    const shareData = { title: item.title, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setContentActionMessage("تم فتح خيارات المشاركة.");
      } else {
        await navigator.clipboard.writeText(`${item.title}\n${url}`);
        setContentActionMessage("تم نسخ اسم المنشور والرابط للمشاركة.");
      }
    } catch {
      setContentActionMessage("يمكنك استخدام روابط المشاركة المباشرة أدناه.");
    }
  };
  const shareContent = async () => {
    if (!selectedContent) return;
    await shareContentItem(selectedContent);
  };
  const handleLike = async () => {
    if (!selectedContent) return;
    try {
      await toggleContentLike.mutateAsync({ contentItemId: selectedContent.id });
      await utils.content.engagement.invalidate(contentEngagementInput);
    } catch (error) {
      setContentActionMessage(error instanceof Error ? error.message : "تعذر تسجيل الإعجاب.");
    }
  };
  const submitComment = async () => {
    if (!selectedContent) return;
    if (!commentBody.trim()) { setContentActionMessage("اكتب تعليقك أولاً."); return; }
    try {
      await addContentComment.mutateAsync({ contentItemId: selectedContent.id, body: commentBody });
      setCommentBody("");
      setContentActionMessage("تم نشر تعليقك.");
      await utils.content.engagement.invalidate(contentEngagementInput);
    } catch (error) {
      setContentActionMessage(error instanceof Error ? error.message : "تعذر نشر التعليق.");
    }
  };
  useEffect(() => {
    const postId = Number(new URLSearchParams(window.location.search).get("post"));
    if (!postId) {
      setIsOpeningSharedContent(false);
      return;
    }
    if (publicContent.isLoading || (publicContent.isFetching && !publicContent.data)) {
      setIsOpeningSharedContent(true);
      return;
    }
    if (!publicContent.data) {
      setIsOpeningSharedContent(false);
      return;
    }
    const sharedItem = publicContent.data.find((item) => item.id === postId);
    if (!sharedItem) {
      setIsOpeningSharedContent(false);
      return;
    }
    if (selectedContent?.id === sharedItem.id) {
      setIsOpeningSharedContent(false);
      return;
    }
    setSelectedContent(sharedItem);
    setContentOpenedFromSharedUrl(sharedItem.kind === "video");
    setContentEngagementInput({ contentItemId: sharedItem.id });
    setIsOpeningSharedContent(false);
  }, [publicContent.data, publicContent.isFetching, publicContent.isLoading, selectedContent?.id]);
  useEffect(() => {
    const camelCode = new URLSearchParams(window.location.search).get("camel");
    if (!camelCode) return;
    if (!publicCamels.isFetchedAfterMount || publicCamels.isFetching) return;
    const normalizedCode = normalizeCamelCode(camelCode);
    const sharedCamel = camels.find((camel) => normalizeCamelCode(camel.id) === normalizedCode);
    if (!sharedCamel) return;
    const selectedIsFresh = selectedCamel?.databaseId === sharedCamel.databaseId
      && selectedCamel?.id === sharedCamel.id
      && selectedCamel?.name === sharedCamel.name
      && selectedCamel?.image === sharedCamel.image
      && selectedCamel?.imagePositionX === sharedCamel.imagePositionX
      && selectedCamel?.imagePositionY === sharedCamel.imagePositionY
      && selectedCamel?.imageScale === sharedCamel.imageScale
      && selectedCamel?.imageRotation === sharedCamel.imageRotation
      && selectedCamel?.shade === sharedCamel.shade
      && selectedCamel?.owner === sharedCamel.owner
      && selectedCamel?.father === sharedCamel.father
      && selectedCamel?.mother === sharedCamel.mother
      && selectedCamel?.maternalBrother === sharedCamel.maternalBrother
      && selectedCamel?.maternalSiblingLabel === sharedCamel.maternalSiblingLabel
      && selectedCamel?.status === sharedCamel.status
      && selectedCamel?.achievements === sharedCamel.achievements
      && selectedCamel?.production === sharedCamel.production
      && selectedCamel?.worker === sharedCamel.worker
      && selectedCamel?.phone === sharedCamel.phone
      && selectedCamel?.subscriptionUrl === sharedCamel.subscriptionUrl
      && selectedCamel?.achievementsUrl === sharedCamel.achievementsUrl
      && selectedCamel?.note === sharedCamel.note;
    if (selectedIsFresh) return;
    setSelectedCamel(sharedCamel);
    setActiveCamelImage(sharedCamel.image);
    resetCamelImageTransform();
    setProductionFilter("all");
    if (sharedCamel.databaseId) setGalleryInput({ camelRecordId: sharedCamel.databaseId });
  }, [camels, selectedCamel, publicCamels.isFetchedAfterMount, publicCamels.isFetching]);
  useEffect(() => {
    if (!selectedCamel) return;
    const imageIndex = Number(new URLSearchParams(window.location.search).get("image") ?? 0);
    if (Number.isInteger(imageIndex) && imageIndex >= 0 && imageIndex < selectedCamelImages.length) {
      setActiveCamelImage(selectedCamelImages[imageIndex]);
    }
  }, [selectedCamel?.id, selectedCamelImages]);
  const copyQrLink = async (url: string, label: string, title?: string) => {
    try {
      await navigator.clipboard.writeText(title ? `${title}\n${url}` : url);
      setQrStatus(`تم نسخ ${label}.`);
    } catch {
      setQrStatus("تعذر النسخ تلقائياً. استخدم زر المشاركة.");
    }
  };
  const shareQrLink = async (title: string, url: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setQrStatus("تم فتح خيارات المشاركة.");
      } else {
        await copyQrLink(url, "الرابط", title);
      }
    } catch {
      setQrStatus("يمكنك نسخ الرابط أو مسح رمز QR.");
    }
  };
  const downloadQr = async (svgId: string, fileName: string, format: "svg" | "pdf") => {
    try {
      if (format === "svg") downloadQrSvg(svgId, fileName);
      else await downloadQrPdf(svgId, fileName);
      setQrStatus(`تم تنزيل رمز QR بصيغة ${format.toUpperCase()} للطباعة.`);
    } catch {
      setQrStatus("تعذر تجهيز ملف الطباعة الآن. حاول مرة أخرى.");
    }
  };
  const shareProductionItem = async (item: PublicContentItem) => {
    const url = getContentShareUrl(item);
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
        setQrStatus("تم فتح خيارات المشاركة.");
      } else {
        await copyQrLink(url, "رابط مادة الإنتاج", item.title);
      }
    } catch {
      setQrStatus("يمكنك استخدام واتساب أو نسخ رابط مادة الإنتاج.");
    }
  };
  const shareReserveLink = async () => {
    const shareData = {
      title: reserve.reserveName,
      url: getReserveUrl(),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("تم فتح خيارات المشاركة");
      } else {
        await navigator.clipboard.writeText(`${reserve.reserveName}\n${getReserveUrl()}`);
        setShareStatus("تم نسخ اسم المحمية والرابط");
      }
    } catch {
      setShareStatus("شارك رابط المحمية");
    }
  };
  const activeGalleryImage = selectedCamel ? activeCamelImage ?? selectedCamel.image : null;
  const activeGalleryImageIndex = Math.max(0, selectedCamelImages.indexOf(activeGalleryImage ?? ""));
  const isPrimaryGalleryImage = Boolean(selectedCamel && activeGalleryImage === selectedCamel.image);
  const activeGalleryImageAdjustments = activeGalleryImage ? selectedCamelImageAdjustments.get(imageAdjustmentKey(activeGalleryImage)) : undefined;
  const camelSwipeDirection = camelSwipeOffset < 0 ? 1 : -1;
  const camelSwipePreviewIndex = camelSwipeOffset === 0 || selectedCamelImages.length < 2
    ? -1
    : getCyclicGalleryIndex(activeGalleryImageIndex, selectedCamelImages.length, camelSwipeDirection);
  const camelSwipePreviewImage = camelSwipePreviewIndex >= 0 ? selectedCamelImages[camelSwipePreviewIndex] : null;
  const selectedContentIsVideo = Boolean(selectedContent && (selectedContent.kind === "video" || selectedContent.durationSeconds !== null));
  const sharedCamelQueryCode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("camel") : null;
  const normalizedSharedCamelQueryCode = sharedCamelQueryCode ? normalizeCamelCode(sharedCamelQueryCode) : null;
  const sharedCamelExistsInPublicData = Boolean(normalizedSharedCamelQueryCode && publicCamels.data?.some((camel) => normalizeCamelCode(camel.recordCode) === normalizedSharedCamelQueryCode));
  const isSharedCamelRoutePending = Boolean(sharedCamelQueryCode && !selectedCamel && !publicCamels.isError && (!publicCamels.data || sharedCamelExistsInPublicData));
  const isSharedCamelRouteMissing = Boolean(sharedCamelQueryCode && !selectedCamel && (publicCamels.isError || (Boolean(publicCamels.data) && !sharedCamelExistsInPublicData)));
  const isSharedContentRoutePending = isOpeningSharedContent && !selectedContent;

  if (isSharedCamelRoutePending) {
    return <div className="site-shell shared-camel-state" dir="rtl"><main><p>جارٍ فتح سجل البعير المطلوب…</p></main></div>;
  }
  if (isSharedCamelRouteMissing) {
    return <div className="site-shell shared-camel-state" dir="rtl"><main><p>تعذر العثور على سجل البعير المطلوب.</p><a href="/">العودة إلى المحمية</a></main></div>;
  }
  if (isSharedContentRoutePending) {
    return <div className="site-shell shared-camel-state" dir="rtl"><main><p>جاري فتح الفيديو…</p></main></div>;
  }

  return (
    <div className="site-shell" dir="rtl">
      <header className="site-header">
        <a href="/" className="brand" aria-label={`العودة إلى الصفحة الرئيسية — ${reserve.reserveName}`}>
          <img src={publicMediaUrl("/manus-storage/zomool-mark_69b1a465.png")} alt="رمز المحمية" />
          <span>
            <strong>{reserve.reserveName}</strong>
            <small>السجل الرقمي للإبل وخدمات المحمية</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          <a href="#top">الرئيسية</a>
          <a href="#herd">سجل الإبل</a>
          <a href="#about">عن المحمية</a>
          <a href="#visit">الزيارة والتواصل</a>
        </nav>

        <a href="#visit" className="header-cta">
          تواصل معنا <ArrowUpLeft size={16} strokeWidth={2.2} />
        </a>

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-label="فتح قائمة التنقل"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {isMenuOpen && (
        <nav className="mobile-nav" aria-label="التنقل عبر الهاتف">
          <a onClick={closeMenu} href="#top">الرئيسية</a>
          <a onClick={closeMenu} href="#herd">سجل الإبل</a>
          <a onClick={closeMenu} href="#about">عن المحمية</a>
          <a onClick={closeMenu} href="#visit">الزيارة والتواصل</a>
          <a onClick={closeMenu} className="mobile-admin-link" href="/admin">الإدارة</a>
        </nav>
      )}

      {activeCelebration && (
        <aside className="celebration-banner" aria-label="تهنئة أو مناسبة حديثة">
          <div className="celebration-lights" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <button type="button" onClick={() => openContent(activeCelebration)} aria-label={`فتح تهنئة ${activeCelebration.title}`}>
            {activeCelebration.mediaUrl && <span className="celebration-media"><img src={activeCelebration.thumbnailUrl || activeCelebration.mediaUrl} alt="" /></span>}
            <span className="celebration-icon"><Sparkles size={19} /></span>
            <span className="celebration-copy"><small>تهنئة أو مناسبة من المحمية</small><strong>{activeCelebration.title}</strong>{activeCelebration.body && <span className="celebration-body-window"><em className="celebration-body-track">{activeCelebration.body}</em></span>}</span>
          </button>
        </aside>
      )}

      <main>
        <section className="hero" id="top">
          <div className="hero-image" />
          <div className="hero-noise" />
          <div className="hero-content">
            <div className="hero-kicker">
              <span className="sun-dot" />
              سجل المحمية الرقمي
            </div>
            <div className="hero-title" role="heading" aria-level={1}>
              <span>لكل بعير في المحمية حكاية</span>
              <strong>ونحن حريصون أن تُكتب كاملة</strong>
            </div>
            <p>
              مساحة منظمة تحفظ تفاصيل الإبل في {reserve.reserveName}، من السلالة والإنجاز إلى الإنتاج والتواصل الميداني.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#herd">
                استكشف سجل الإبل <ArrowDownLeft size={18} />
              </a>
              <button type="button" className="text-link light-link share-trigger" onClick={shareReserveLink}>
                <Share2 size={16} /> {shareStatus}
              </button>
            </div>
          </div>
          <div className="hero-index">
            <p className="hero-origin-label">من رمال الإمارات</p>
          </div>
          <div className="hero-line" />
        </section>

        <section className="mobile-hero-copy" aria-label="تعريف المحمية">
          <div className="hero-kicker">
            <span className="sun-dot" />
            سجل المحمية الرقمي
          </div>
          <div className="hero-title" role="heading" aria-level={1}>
            <span>لكل بعير في المحمية حكاية</span>
            <strong>ونحن حريصون أن تُكتب كاملة</strong>
          </div>
          <p>مساحة منظمة تحفظ تفاصيل الإبل في {reserve.reserveName}، من السلالة والإنجاز إلى الإنتاج والتواصل الميداني.</p>
          <div className="hero-actions">
            <a className="button-primary" href="#herd">
              استكشف سجل الإبل <ArrowDownLeft size={18} />
            </a>
            <button type="button" className="text-link light-link share-trigger" onClick={shareReserveLink}>
              <Share2 size={16} /> {shareStatus}
            </button>
          </div>
        </section>

        {latestAnnouncement && (
          <section className="announcement-ticker" aria-label="أحدث إعلانات المحمية">
            <span className="announcement-ticker-label">أحدث إعلان</span>
            <button type="button" onClick={() => openContent(latestAnnouncement)} aria-label={`فتح الإعلان ${latestAnnouncement.title}`}>
              {latestAnnouncement.mediaUrl && <span className="announcement-ticker-media">{latestAnnouncement.durationSeconds !== null ? <img src={latestAnnouncement.thumbnailUrl || latestAnnouncement.mediaUrl} alt="" /> : <img src={latestAnnouncement.mediaUrl} alt="" />}</span>}
              <span className="announcement-ticker-track"><span className="announcement-ticker-item"><strong>{latestAnnouncement.title}</strong>{latestAnnouncement.body && <em>— {latestAnnouncement.body}</em>}</span></span>
              <ChevronLeft size={19} />
            </button>
          </section>
        )}

        <section className="intro-strip" id="about">
          <div className="intro-lead">
            <SectionLabel>عن المحمية</SectionLabel>
            <p>
              صُمم هذا السجل ليجمع معلومات كل بعير في مكان واحد؛ بطاقة واضحة تحفظ التفاصيل، ويستطيع فريق المحمية تحديثها متى توفرت البيانات المعتمدة.
            </p>
          </div>
          <div className="strip-facts">
            <div>
              <span>الهوية</span>
              <strong>زمول الخييلي</strong>
            </div>
            <div>
              <span>أسلوب السجل</span>
              <strong>بيانات ميدانية منظمة</strong>
            </div>
            <div>
              <span>حالة المحتوى</span>
              <strong>جاهز لإضافة البيانات</strong>
            </div>
          </div>
        </section>

        <section className="herd-section" id="herd">
          <div className="section-heading-row">
            <div>
              <SectionLabel>سجل الزمول</SectionLabel>
            </div>
          </div>

          <div className="camel-grid">
            {camels.map((camel, index) => (
              <article id={`camel-card-${camel.id}`} className={`camel-card camel-card-${index + 1}`} key={camel.id}>
                <div className="camel-card-topbar" aria-label={`سجل ${camel.name}`}>
                  <span>{camel.name}</span>
                </div>
                <button type="button" className="camel-photo-wrap camel-photo-frame camel-photo-button" onClick={() => openCamel(camel)} aria-label={`فتح معرض صور ${camel.name}`}>
                  <img src={camel.image} alt={`صورة ${camel.name}`} className="camel-photo" style={imageAdjustmentStyle(camel)} />
                  <div className="photo-overlay" />
                  <span className="camel-number">{camel.id}</span>
                  <span className="camel-photo-count"><Images size={14} /> {formatCamelCardPhotoLabel()}</span>
                </button>
                <div className="camel-card-body">
                  <div className="record-state"><span /> حالة التوثيق: {camel.status}</div>
                  <div className="dialog-facts camel-card-facts">
                    <div className="lineage-origin-fact"><span>الأصل</span><strong className="parent-value"><b>{camel.father}</b><i aria-hidden="true"> × </i><b>{camel.mother}</b></strong></div>
                    <div className="lineage-maternal-fact"><span>الإخوة من الأم</span><strong>{camel.maternalBrother}</strong></div>
                    <div><span>الإنجازات</span><strong>{camel.achievements}</strong></div>
                    <div><span>الإنتاج</span><strong>{camel.production}</strong></div>
                    <div><span>الجهة أو المالك</span><strong>{camel.owner}</strong></div>
                  </div>
                </div>
                <button className="view-profile" onClick={() => openCamel(camel)}>
                  فتح سجل البعير <ArrowUpLeft size={16} />
                </button>
              </article>
            ))}
          </div>

          <div className="template-note">
            <ClipboardList size={21} />
            <p><strong>سجل الزمول قابل للتحديث والتوسع.</strong> تُضاف بطاقة كل زمول جديد، وتُحدّث حقول الإنتاج والإنجازات والنسب والتواصل في مصدر بيانات موحّد.</p>
          </div>
        </section>

        {fieldUpdates.length > 0 && (
          <section className="reserve-updates" aria-label="أخبار وإعلانات المحمية">
            <div className="section-heading-row">
              <div>
                <SectionLabel>مستجدات المحمية</SectionLabel>
                <h2>أخبار وصور <em>من الميدان</em></h2>
              </div>
              <p className="section-aside">تُدار هذه المستجدات من لوحة المحمية ويمكن ربط كل مادة بسجل بعير محدد عند النشر.</p>
            </div>
            <div className="updates-grid">
              {fieldUpdates.map((item) => (
                <article className="update-card" key={item.id}>
                  <button className="update-card-button" type="button" onClick={() => openContent(item)} aria-label={`قراءة تفاصيل ${item.title}`}>
                    {item.mediaUrl && (
                      <div className={item.kind === "video" ? "update-card-media is-video-poster" : "update-card-media"}>
                        {item.kind === "video" ? hasUsableVideoThumbnail(item.thumbnailUrl) ? <img src={item.thumbnailUrl ?? undefined} alt={`معاينة فيديو ${item.title}`} /> : <video muted playsInline preload="metadata" src={item.mediaUrl ?? undefined} aria-hidden="true" onLoadedData={(event) => event.currentTarget.pause()} /> : <img src={item.mediaUrl} alt={item.title} />}
                        {item.kind === "video" && <span className="update-video-shade" aria-hidden="true" />}
                        {item.kind === "video" && <span className="update-video-play" aria-hidden="true">▶</span>}
                        {item.kind === "video" && <span className="update-video-caption">مشاهدة الفيديو</span>}
                        {item.kind === "video" && item.durationSeconds !== null && <span className="update-video-duration">{formatMediaDuration(item.durationSeconds)}</span>}
                        <span className="update-card-open"><ChevronLeft size={18} /></span>
                      </div>
                    )}
                    <div className="update-card-body">
                      <span>{item.kind === "news" ? "خبر" : item.kind === "video" ? "فيديو" : "صورة"}</span>
                      <h3>{item.title}</h3>
                      {item.body && <p>{item.body}</p>}
                      <time className="update-published-at" dateTime={new Date(item.publishedAt).toISOString()}>نُشر في {formatPublishedAt(item.publishedAt)}</time>
                      <strong className="update-read-more">قراءة التفاصيل <ArrowUpLeft size={15} /></strong>
                    </div>
                  </button>
                  <div className="update-card-footer"><span><Heart size={14} /> {item.likeCount ?? 0} إعجاب</span><button type="button" onClick={() => shareContentItem(item)}><Share2 size={14} /> مشاركة</button></div>
                </article>
              ))}
            </div>
          </section>
        )}

        {reserveVideoItems.length > 0 && (
          <section className="reserve-updates reserve-video-section" aria-label="فيديوهات المحمية">
            <div className="section-heading-row">
              <div>
                <SectionLabel>فيديوهات المحمية</SectionLabel>
                <h2>لقطات من <em>الميدان</em></h2>
              </div>
              <p className="section-aside">فيديوهات عامة للمحمية تظهر هنا في الصفحة الرئيسية فقط، ولا تُدرج داخل سجل أي بعير.</p>
            </div>
            <div className="updates-grid reserve-video-grid">
              {reserveVideoItems.map((item) => (
                <article className="update-card" key={item.id}>
                  <button className="update-card-button" type="button" onClick={() => openContent(item)} aria-label={`فتح فيديو المحمية ${item.title}`}>
                    <div className="update-card-media is-video-poster">
                      {hasUsableVideoThumbnail(item.thumbnailUrl) ? <img src={item.thumbnailUrl ?? undefined} alt={`معاينة فيديو ${item.title}`} /> : <video muted playsInline preload="metadata" src={item.mediaUrl ?? undefined} aria-hidden="true" onLoadedData={(event) => event.currentTarget.pause()} />}
                      <span className="update-video-shade" aria-hidden="true" />
                      <span className="update-video-play" aria-hidden="true">▶</span>
                      <span className="update-video-caption">مشاهدة الفيديو</span>
                      {item.durationSeconds !== null && <span className="update-video-duration">{formatMediaDuration(item.durationSeconds)}</span>}
                      <span className="update-card-open"><ChevronLeft size={18} /></span>
                    </div>
                    <div className="update-card-body">
                      <span>فيديو المحمية</span>
                      <h3>{item.title}</h3>
                      {item.body && <p>{item.body}</p>}
                      <time className="update-published-at" dateTime={new Date(item.publishedAt).toISOString()}>نُشر في {formatPublishedAt(item.publishedAt)}</time>
                      <strong className="update-read-more">مشاهدة الفيديو <ArrowUpLeft size={15} /></strong>
                    </div>
                  </button>
                  <div className="update-card-footer"><span><Send size={14} /> فيديو عام للمحمية</span><button type="button" onClick={() => shareContentItem(item)}><Share2 size={14} /> مشاركة</button></div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="visit-section" id="visit">
          <div className="visit-image" />
          <div className="visit-content">
            <SectionLabel>زيارة وتواصل</SectionLabel>
            <h2>تفاصيل المحمية<br /><em>في متناولك</em></h2>
            <p>
              {reserve.visitDescription}
            </p>

            <div className="visit-details">
              <div className="visit-detail visit-map-detail">
                <span className="detail-icon"><MapPin size={18} /></span>
                <div><small>موقع المحمية</small><strong>{reserve.locationName}</strong><a className="open-map-button" href={reserve.mapUrl} target="_blank" rel="noreferrer" aria-label="افتح خريطة موقع المحمية"><MapPin size={14} /> افتح الخريطة <ExternalLink size={13} /></a></div>
              </div>
              <div className="visit-detail visit-contact-detail">
                <span className="detail-icon"><Phone size={18} /></span>
                <div><small>رقم المسؤول</small><a className="phone-number" dir="ltr" href={phoneLink(reserve.phone)}>{formatPhoneNumber(reserve.phone)}</a><div className="phone-actions"><a href={phoneLink(reserve.phone)} aria-label="الاتصال بالعامل">اتصال</a><a className="is-whatsapp" href={whatsappLink(reserve.phone)} target="_blank" rel="noreferrer" aria-label="فتح واتساب العامل">واتساب العامل</a></div></div>
              </div>
              <a className="visit-detail social-detail" href="https://www.instagram.com/zmool_esk/" target="_blank" rel="noreferrer" aria-label="فتح إنستغرام المحمية">
                <span className="detail-icon social-icon instagram-icon"><Instagram size={18} /></span>
                <div><small>إنستغرام المحمية</small><strong dir="ltr">@zmool_esk</strong></div>
              </a>
              <a className="visit-detail social-detail" href="https://www.snapchat.com/add/ii_nbk" target="_blank" rel="noreferrer" aria-label="فتح سناب شات المحمية">
                <span className="detail-icon social-icon snapchat-icon"><Ghost size={18} /></span>
                <div><small>سناب شات المحمية</small><strong dir="ltr">ii_nbk</strong></div>
              </a>
              <div className="visit-detail">
                <span className="detail-icon"><ShieldCheck size={18} /></span>
                <div><small>الخدمات البيطرية</small><strong>{reserve.veterinaryService}</strong></div>
              </div>
              <div className="visit-detail">
                <span className="detail-icon"><Sparkles size={18} /></span>
                <div><small>خدمة المناخ</small><strong>{reserve.climateService}</strong></div>
              </div>
              <div className="visit-detail">
                <span className="detail-icon"><CalendarDays size={18} /></span>
                <div><small>أوقات الزيارة</small><strong>{reserve.visitHours}</strong></div>
              </div>
            </div>
          </div>
          <div className="visit-stamp"><Sparkles size={15} /> زمول الخييلي</div>
        </section>

        <section className="qr-reserve-section" aria-label="رمز الوصول إلى معلومات المحمية">
          <div className="qr-reserve-copy"><SectionLabel>رمز الوصول السريع</SectionLabel><h2>امسح الرمز، <em>وافتح سجل المحمية.</em></h2><p>يوصل هذا الرمز مباشرة إلى معلومات المحمية وسجل الإبل والخدمات ووسائل التواصل من الموقع الرسمي.</p><div className="qr-reserve-actions"><button type="button" onClick={() => copyQrLink(getReserveUrl(), "رابط المحمية")}><Copy size={15} /> نسخ الرابط</button><button type="button" onClick={() => shareQrLink(reserve.reserveName, getReserveUrl())}><Share2 size={15} /> مشاركة الرابط</button><button type="button" onClick={() => downloadQr("reserve-qr", "zomool-sheikh-tahnoun-reserve", "svg")}><Download size={15} /> تنزيل SVG</button><button type="button" onClick={() => void downloadQr("reserve-qr", "zomool-sheikh-tahnoun-reserve", "pdf")}><Download size={15} /> تنزيل PDF</button></div>{qrStatus && <p role="status" className="qr-status">{qrStatus}</p>}</div>
          <div className="qr-code-card"><QRCodeSVG id="reserve-qr" value={getReserveUrl()} size={156} level="M" includeMargin aria-label={`رمز QR لمعلومات ${reserve.reserveName}`} /><span><QrCode size={15} /> امسح بكاميرا الهاتف</span></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src={publicMediaUrl("/manus-storage/zomool-mark_69b1a465.png")} alt="رمز المحمية" />
          <p>{reserve.reserveName}</p>
        </div>
        <p>سجل رقمي خاص بالإبل والمعلومات الميدانية.</p>
        <a href="/admin">إدارة المحمية</a>
        <a href="#top">العودة إلى الأعلى ↑</a>
      </footer>

      {selectedCamel && (
        <div className="dialog-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) closeCamel(); }}>
          <section className="camel-dialog" role="dialog" aria-modal="true" aria-labelledby="camel-dialog-title" onPointerDown={(event) => event.stopPropagation()}>
            <button type="button" className="dialog-close" aria-label="إغلاق البطاقة" onClick={closeCamel}><X size={20} /></button>
            <div className="camel-dialog-media-stack">
              <div
                ref={camelGalleryRef}
                className={isPrimaryGalleryImage ? "dialog-image is-primary" : "dialog-image"}
                style={{ "--dialog-image-bg": `url("${activeGalleryImage ?? selectedCamel.image}")` } as React.CSSProperties}
                onTouchStart={(event) => {
                  const firstTouch = event.touches[0];
                  setCamelSwipeTransition(false);
                  if (event.touches.length >= 2) {
                    camelPinchStartDistance.current = getTouchDistance(event.touches);
                    camelPinchStartZoom.current = camelImageZoom;
                    camelWasPinching.current = true;
                    camelImageSwipeStartX.current = null;
                    camelPanStart.current = null;
                    return;
                  }
                  camelWasPinching.current = false;
                  camelImageSwipeStartX.current = firstTouch?.clientX ?? null;
                  camelPanStart.current = camelImageZoom > 1 && firstTouch
                    ? { x: camelImagePan.x, y: camelImagePan.y, pointerX: firstTouch.clientX, pointerY: firstTouch.clientY }
                    : null;
                }}
                onTouchMove={(event) => {
                  if (event.touches.length >= 2) {
                    event.preventDefault();
                    const startDistance = camelPinchStartDistance.current;
                    if (startDistance) {
                      const nextZoom = clampCamelZoom(camelPinchStartZoom.current * (getTouchDistance(event.touches) / startDistance));
                      setCamelImageZoom(nextZoom);
                      setCamelImagePan((current) => ({ x: clampCamelPan(current.x, nextZoom), y: clampCamelPan(current.y, nextZoom) }));
                    }
                    camelWasPinching.current = true;
                    return;
                  }
                  const touch = event.touches[0];
                  const panStart = camelPanStart.current;
                  const swipeStartX = camelImageSwipeStartX.current;
                  if (!touch) return;
                  if (panStart && camelImageZoom > 1) {
                    event.preventDefault();
                    setCamelImagePan({
                      x: clampCamelPan(panStart.x + touch.clientX - panStart.pointerX, camelImageZoom),
                      y: clampCamelPan(panStart.y + touch.clientY - panStart.pointerY, camelImageZoom),
                    });
                    return;
                  }
                  if (swipeStartX !== null && selectedCamelImages.length > 1) {
                    event.preventDefault();
                    setCamelSwipeTransition(false);
                    const rawOffset = touch.clientX - swipeStartX;
                    const limitedOffset = Math.max(-420, Math.min(420, rawOffset));
                    setCamelSwipeOffset(limitedOffset);
                  }
                }}
                onTouchEnd={(event) => {
                  const wasPinching = camelWasPinching.current || camelPinchStartDistance.current !== null;
                  camelPinchStartDistance.current = null;
                  camelPanStart.current = null;
                  const startX = camelImageSwipeStartX.current;
                  const endX = event.changedTouches[0]?.clientX;
                  camelImageSwipeStartX.current = null;
                  if (wasPinching || camelImageZoom > 1 || startX === null || endX === undefined || selectedCamelImages.length < 2) {
                    setCamelSwipeOffset(0);
                    return;
                  }
                  const distance = endX - startX;
                  if (Math.abs(distance) < 42) {
                    setCamelSwipeOffset(0);
                    return;
                  }
                  const direction = distance < 0 ? 1 : -1;
                  moveCamelGalleryImage(direction);
                }}
                onTouchCancel={() => { camelImageSwipeStartX.current = null; camelPinchStartDistance.current = null; camelPanStart.current = null; camelWasPinching.current = false; cancelCamelSwipeMotion(); }}
                aria-label="كبّر الصورة بإصبعين، واسحب بإصبع لتحريكها عند التكبير"
              >
                <img
                  className="camel-swipe-image"
                  src={cacheBustedMedia(activeGalleryImage ?? selectedCamel.image)}
                  alt={`صورة ${selectedCamel.name}`}
                  draggable={false}
                  style={{
                    ...imageAdjustmentStyle(activeGalleryImageAdjustments, { translateX: camelImagePan.x + camelSwipeOffset, translateY: camelImagePan.y, scale: camelImageZoom }),
                    transition: camelSwipeTransition ? `transform ${CAMEL_SWIPE_DURATION_MS}ms cubic-bezier(0.23, 1, 0.32, 1)` : "none",
                  }}
                />
                {camelSwipePreviewImage && <img
                  className="camel-swipe-image"
                  src={cacheBustedMedia(camelSwipePreviewImage)}
                  alt={`الصورة التالية من صور ${selectedCamel.name}`}
                  draggable={false}
                  style={{
                    ...imageAdjustmentStyle(selectedCamelImageAdjustments.get(imageAdjustmentKey(camelSwipePreviewImage ?? ""))),
                    transform: `translate3d(${camelSwipeOffset + (camelSwipeDirection === 1 ? (camelGalleryRef.current?.clientWidth ?? 360) : -(camelGalleryRef.current?.clientWidth ?? 360))}px, 0, 0)`,
                    transition: camelSwipeTransition ? `transform ${CAMEL_SWIPE_DURATION_MS}ms cubic-bezier(0.23, 1, 0.32, 1)` : "none",
                  }}
                />}
              </div>
              {selectedCamelImages.length > 1 && <div className="camel-gallery-navigation" aria-label={`التنقل بين صور ${selectedCamel.name}`}>
                <button type="button" className="camel-gallery-arrow" onClick={() => moveCamelGalleryImage(1)} aria-label="الصورة التالية"><ChevronLeft size={18} /></button>
                <div className="camel-gallery-dots" role="tablist" aria-label="صور المعرض">
                  {selectedCamelImages.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => selectCamelGalleryImage(index)} className={index === activeGalleryImageIndex ? "is-active" : ""} aria-label={`عرض الصورة ${index + 1}`} aria-selected={index === activeGalleryImageIndex} role="tab" />)}
                </div>
                <span className="camel-gallery-count">{activeGalleryImageIndex + 1} / {selectedCamelImages.length}</span>
              </div>}
            </div>
            <div className="dialog-content">
              <span className="dialog-id">{selectedCamel.id} / بطاقة تعريف</span>
              <h2 id="camel-dialog-title" className="camel-dialog-name">{selectedCamel.name}</h2>
              <div className="dialog-facts">
                <div><span>الأب</span><strong className="parent-value">{selectedCamel.father}</strong></div>
                <div><span>الأم</span><strong className="parent-value">{selectedCamel.mother}</strong></div>
                <div className="lineage-maternal-fact"><span>الإخوة من الأم</span><strong>{selectedCamel.maternalBrother}</strong></div>
                <div><span>الإنجازات</span><strong>{selectedCamel.achievements}</strong></div>
                <div><span>الإنتاج</span><strong>{selectedCamel.production}</strong></div>
                <div><span>الجهة أو المالك</span><strong>{selectedCamel.owner}</strong></div>
                <div><span>العامل</span><strong>{selectedCamel.worker}</strong></div>
                <div><span>رقم التواصل</span><strong className="phone-number" dir="ltr">{formatPhoneNumber(selectedCamel.phone)}</strong></div>
              </div>
              <div className="camel-contact-actions" aria-label={`التواصل مع العامل ${selectedCamel.worker}`}>
                <a className="camel-contact-button" href={phoneLink(selectedCamel.phone)}><Phone size={16} /> اتصال بالعامل</a>
                <a className="camel-contact-button is-whatsapp" href={whatsappLink(selectedCamel.phone)} target="_blank" rel="noreferrer"><MessageCircle size={16} /> واتساب العامل</a>
              </div>
              <div className="record-timeline" aria-label="مسار التوثيق">
                <span><i /> هوية البعير</span>
                <span><i /> السلالة والإنتاج</span>
                <span><i /> مسؤول التواصل</span>
              </div>
              <p className="dialog-disclaimer">هذه بطاقة نموذجية صُممت لاستقبال البيانات المعتمدة الخاصة بالمحمية.</p>
              {selectedCamel.achievementsUrl && <section className="camel-achievements-card" aria-label={`إنجازات ${selectedCamel.name}`}><div><div className="camel-achievements-heading"><Trophy size={16} /> <span>إنجازات البعير</span></div><strong>ركض وسباقات {selectedCamel.name}</strong><p>رابط مستقل لعرض إنجازات البعير في الركض والسباقات.</p></div><a href={selectedCamel.achievementsUrl} target="_blank" rel="noreferrer">فتح رابط الإنجازات <ExternalLink size={15} /></a></section>}
              {selectedCamel.subscriptionUrl && <section className="camel-subscription-card" aria-label={`اشتراك ${selectedCamel.name}`}><div><div className="camel-subscription-heading"><ExternalLink size={16} /> <span>اشتراك البعير</span></div><strong>رابط خاص بالبعير {selectedCamel.name}</strong><p>اضغط لفتح صفحة الاشتراك المرتبطة بهذا السجل.</p></div><a href={selectedCamel.subscriptionUrl} target="_blank" rel="noreferrer">فتح رابط الاشتراك <ExternalLink size={15} /></a></section>}
              {selectedCamelProductionLinks.isLoading && selectedCamelProductionLinksFallback.length === 0 && <p className="camel-production-empty">جارٍ تحميل روابط إنتاج {selectedCamel.name}...</p>}
              {selectedCamelProductionLinks.isError && selectedCamelProductionLinksFallback.length === 0 && <p role="alert" className="camel-production-empty">تعذر تحميل روابط الإنتاج حالياً. يمكنك المحاولة مرة أخرى بعد قليل.</p>}
              {selectedCamelProductionLinkItems.length > 0 && <section className="camel-production-links" aria-label={`روابط إنتاج ${selectedCamel.name}`}><div className="camel-gallery-heading"><span><ExternalLink size={16} /> روابط إنتاج البعير</span><strong>{selectedCamelProductionLinkItems.length} روابط</strong></div><p className="camel-production-intro">روابط أصلية لإنتاج {selectedCamel.name} على المنصات الخارجية، وتُفتح من مصدرها مباشرة.</p><ol className="production-external-links">{selectedCamelProductionLinkItems.map((link, index) => <li key={link.id}><a href={link.url} target="_blank" rel="noreferrer"><span><b>{index + 1}. {link.title}</b><small>{link.platform} · تاريخ الربط: {formatLinkDate(link.linkedAt)}</small></span><ExternalLink size={17} /></a></li>)}</ol></section>}
              {selectedCamelProductionPosts.length > 0 && <section className="camel-production-posts" aria-label={`إنتاج ووسائط ${selectedCamel.name}`}><div className="camel-gallery-heading"><span><Send size={16} /> سجل إنتاج البعير</span><strong>{selectedCamelProductionPosts.length} مواد موثقة</strong></div><p className="camel-production-intro">صور وفيديوهات وأخبار مرتبطة بإنتاج {selectedCamel.name}. اضغط البطاقة لفتح المادة، أو استخدم واتساب والمشاركة لإرسال الرابط.</p><div className="production-filter-tabs" role="tablist" aria-label="تصفية سجل الإنتاج">{(["all", "video", "photo", "news"] as ProductionFilter[]).map((filter) => <button key={filter} type="button" role="tab" aria-selected={productionFilter === filter} className={productionFilter === filter ? "is-active" : ""} onClick={() => setProductionFilter(filter)}>{filter === "all" ? "الكل" : filter === "video" ? "الفيديوهات" : filter === "photo" ? "الصور" : "الأخبار"}</button>)}</div><div className="production-media-cards">{filteredCamelProductionPosts.map((item) => <article className="production-media-card" key={item.id}><button type="button" className="production-card-open" onClick={() => { closeCamel(); openContent(item); }}><div className="production-card-media">{item.mediaUrl ? item.kind === "video" ? hasUsableVideoThumbnail(item.thumbnailUrl) ? <img src={item.thumbnailUrl ?? undefined} alt={`معاينة فيديو ${item.title}`} /> : <video muted playsInline preload="metadata" src={item.mediaUrl ?? undefined} aria-hidden="true" onLoadedData={(event) => event.currentTarget.pause()} /> : <img src={item.mediaUrl} alt={item.title} /> : <span>مادة إنتاج موثقة</span>}<b>{item.kind === "announcement" ? "إعلان" : item.kind === "video" ? "فيديو إنتاج" : item.kind === "photo" ? "صورة إنتاج" : "خبر إنتاج"}</b>{item.kind === "video" && <i className="production-video-play" aria-hidden="true">▶</i>}{item.kind === "video" && item.durationSeconds !== null && <i className="production-video-duration">{formatMediaDuration(item.durationSeconds)}</i>}</div><div className="production-card-body"><h3>{item.title}</h3>{item.body && <p>{item.body}</p>}<div className="production-lineage"><span>البعير <strong>{selectedCamel.name}</strong></span><span>الأب <strong>{selectedCamel.father}</strong></span><span>الأم <strong>{selectedCamel.mother}</strong></span></div><p className="production-record"><b>بيانات الإنتاج:</b> {selectedCamel.production}</p><small>من إنتاج {selectedCamel.name} · نُشر في {formatPublishedAt(item.publishedAt)}</small></div></button><div className="production-card-actions"><a href={`https://wa.me/?text=${encodeURIComponent(`${item.title} — ${getContentShareUrl(item)}`)}`} target="_blank" rel="noreferrer">واتساب</a><button type="button" onClick={() => shareProductionItem(item)}><Share2 size={15} /> مشاركة</button><button type="button" onClick={() => copyQrLink(getContentShareUrl(item), "رابط مادة الإنتاج")}><Copy size={15} /> نسخ الرابط</button></div></article>)}</div>{filteredCamelProductionPosts.length === 0 && <p className="camel-production-empty">لا توجد مواد ضمن هذا التصنيف لهذا البعير بعد.</p>}</section>}
              {selectedCamelProductionPosts.length === 0 && !selectedCamelProductionLinks.isLoading && !selectedCamelProductionLinks.isError && selectedCamelProductionLinkItems.length === 0 && <p className="camel-production-empty">لا توجد روابط إنتاج أو صور أو فيديوهات منشورة لهذا البعير بعد. يمكن للإدارة لصق رابط إنتاجه من بطاقة البعير في لوحة الإدارة.</p>}
              <section className="camel-qr-card" aria-label={`رمز QR لبطاقة ${selectedCamel.name}`}><div><span className="dialog-id">بطاقة QR تعريفية</span><strong>امسح الرمز لفتح سجل {selectedCamel.name}</strong><small>يشمل الهوية والنسب والإنجازات والإنتاج والصور والوسائط المرتبطة.</small><div className="camel-qr-actions"><button type="button" onClick={() => copyQrLink(getCamelUrl(selectedCamel), `رابط ${selectedCamel.name}`)}><Copy size={13} /> نسخ الرابط</button><button type="button" onClick={() => shareQrLink(selectedCamel.name, getCamelUrl(selectedCamel))}><Share2 size={13} /> مشاركة</button><button type="button" onClick={() => downloadQr(`camel-qr-${selectedCamel.id}`, selectedCamel.id, "svg")}><Download size={13} /> SVG</button><button type="button" onClick={() => void downloadQr(`camel-qr-${selectedCamel.id}`, selectedCamel.id, "pdf")}><Download size={13} /> PDF</button></div>{qrStatus && <p role="status" className="qr-status">{qrStatus}</p>}</div><div className="camel-qr-code"><QRCodeSVG id={`camel-qr-${selectedCamel.id}`} value={getCamelUrl(selectedCamel)} size={112} level="M" includeMargin aria-label={`رمز QR لسجل ${selectedCamel.name}`} /></div></section>
              <button type="button" className="camel-browse-more" onClick={closeCamel}><ChevronLeft size={17} /> تصفح الزمول الأخرى</button>
            </div>
          </section>
        </div>
      )}

      {selectedContent && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={closeContent}>
          <section className={selectedContent.kind === "video" ? "content-dialog content-dialog-video" : "content-dialog"} role="dialog" aria-modal="true" aria-labelledby="content-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="dialog-close" onClick={closeContent} aria-label="إغلاق تفاصيل المنشور"><X size={20} /></button>
            {selectedContent.mediaUrl && (
              <div className="content-dialog-media">
                {selectedContentIsVideo ? <video controls playsInline preload="metadata" poster={selectedContent.thumbnailUrl || undefined} src={selectedContent.mediaUrl} /> : <img src={selectedContent.mediaUrl} alt={selectedContent.title} />}
              </div>
            )}
            <div className="content-dialog-body">
              <span className="content-dialog-kind">{selectedContent.kind === "news" ? "خبر من المحمية" : selectedContent.kind === "announcement" ? "إعلان المحمية" : selectedContent.kind === "celebration" ? "تهنئة أو مناسبة" : selectedContent.kind === "video" ? "فيديو من الميدان" : "صورة من الميدان"}</span>
              <h2 id="content-dialog-title">{selectedContent.title}</h2>
              <time className="content-dialog-time" dateTime={new Date(selectedContent.publishedAt).toISOString()}>نُشر في {formatPublishedAt(selectedContent.publishedAt)}</time>
              {selectedContentIsVideo && selectedContent.durationSeconds !== null && <span className="content-dialog-duration">مدة الفيديو: {formatMediaDuration(selectedContent.durationSeconds)}</span>}
              <p>{selectedContent.body || "لم تُضف تفاصيل نصية لهذا المنشور بعد."}</p>
              <div className="content-action-row">
                <button type="button" className={selectedContentEngagement.data?.liked ? "content-like is-liked" : "content-like"} onClick={handleLike} disabled={toggleContentLike.isPending}><Heart size={17} fill={selectedContentEngagement.data?.liked ? "currentColor" : "none"} /> {selectedContentEngagement.data?.likeCount ?? 0} إعجاب</button>
                <button type="button" className="content-share" onClick={shareContent}><Share2 size={17} /> مشاركة</button>
              </div>
              <div className="content-share-links"><a href={`https://wa.me/?text=${encodeURIComponent(`${selectedContent.title} — ${getContentShareUrl(selectedContent)}`)}`} target="_blank" rel="noreferrer">واتساب</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getContentShareUrl(selectedContent))}`} target="_blank" rel="noreferrer">فيسبوك</a><a href={`https://x.com/intent/post?text=${encodeURIComponent(`${selectedContent.title} ${getContentShareUrl(selectedContent)}`)}`} target="_blank" rel="noreferrer">X</a><button type="button" onClick={shareContent}><Copy size={13} /> نسخ الرابط</button></div>
              <section className="content-comments" aria-label="التعليقات"><div className="content-comments-heading"><span><MessageCircle size={17} /> التعليقات</span><strong>{selectedContentEngagement.data?.comments.length ?? 0}</strong></div><div className="comment-form"><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength={1000} placeholder="اكتب تعليقاً محترماً حول هذا المنشور..." /><button type="button" onClick={submitComment} disabled={addContentComment.isPending}>{addContentComment.isPending ? "جارٍ النشر..." : "نشر التعليق"}</button><small>سيظهر التعليق باسم «زائر المحمية».</small></div><div className="comments-list">{selectedContentEngagement.data?.comments.map((comment) => <article key={comment.id}><strong>{comment.authorName || "زائر المحمية"}</strong><time>{formatPublishedAt(comment.createdAt)}</time><p>{comment.body}</p></article>)}{!selectedContentEngagement.isLoading && selectedContentEngagement.data?.comments.length === 0 && <p className="comments-empty">لا توجد تعليقات بعد. كن أول من يشارك رأيه.</p>}</div></section>
              {contentActionMessage && <p role="status" className="content-action-message">{contentActionMessage}</p>}
              <button className="content-dialog-close" type="button" onClick={closeContent}>إغلاق التفاصيل</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
