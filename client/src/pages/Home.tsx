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
  ExternalLink,
  Heart,
  Images,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  QrCode,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { camelRecords, type CamelRecord } from "@/data/camelRecords";
import { CELEBRATION_WINDOW_MS, getCelebrationHoursRemaining, isCelebrationActive } from "@/lib/celebrationTiming";
import { getCyclicGalleryIndex } from "@/lib/galleryNavigation";
import { trpc } from "@/lib/trpc";

const defaultReserve = {
  reserveName: "محمية زمول عيسى بن سعيد الخييلي",
  locationName: "ميدان الشيخ سلطان بن زايد للتراث",
  mapUrl: "https://maps.google.com/?q=24.4725890,55.2180330",
  phone: "+971 50 441 9789",
  veterinaryService: "فحص البروسيلا متاح داخل المحمية",
  climateService: "متاح مجاناً دون أي رسوم",
  visitHours: "تُنشر بعد اعتماد إدارة المحمية",
  visitDescription: "تضم المحمية موقعاً ميدانياً في سويحان، ووسيلة مباشرة للتواصل مع المسؤول، إلى جانب خدمة فحص البروسيلا وخدمة المناخ المتاحة مجاناً دون رسوم.",
};

const PUBLIC_SITE_URL = "https://zomoolreserv-9qm89e3w.manus.space";

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

function formatMediaDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span />
      <p>{children}</p>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [selectedCamel, setSelectedCamel] = useState<(CamelRecord & { databaseId?: number }) | null>(null);
  const [selectedContent, setSelectedContent] = useState<PublicContentItem | null>(null);
  const [galleryInput, setGalleryInput] = useState({ camelRecordId: 1 });
  const [contentEngagementInput, setContentEngagementInput] = useState({ contentItemId: 1 });
  const [activeCamelImage, setActiveCamelImage] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [contentActionMessage, setContentActionMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("شارك رابط المحمية");
  const [qrStatus, setQrStatus] = useState("");
  const [productionFilter, setProductionFilter] = useState<ProductionFilter>("all");
  const [celebrationClock, setCelebrationClock] = useState(() => Date.now());
  const camelImageSwipeStartX = useRef<number | null>(null);
  const publicCamels = trpc.camel.listPublic.useQuery();
  const publicContent = trpc.content.listPublic.useQuery();
  const publicReserve = trpc.reserve.getPublic.useQuery();
  const camelPhotoCounts = trpc.camelPhotos.counts.useQuery();
  const selectedCamelPhotos = trpc.camelPhotos.list.useQuery(galleryInput, { enabled: Boolean(selectedCamel?.databaseId) });
  const selectedCamelProductionLinksInput = useMemo(() => ({ camelRecordId: selectedCamel?.databaseId ?? 1 }), [selectedCamel?.databaseId]);
  const selectedCamelProductionLinks = trpc.camelProductionLinks.list.useQuery(selectedCamelProductionLinksInput, { enabled: Boolean(selectedCamel?.databaseId) });
  const selectedContentEngagement = trpc.content.engagement.useQuery(contentEngagementInput, { enabled: Boolean(selectedContent) });
  const toggleContentLike = trpc.content.toggleLike.useMutation();
  const addContentComment = trpc.content.addComment.useMutation();
  const utils = trpc.useUtils();
  const reserve = publicReserve.data ?? defaultReserve;
  const camels: (CamelRecord & { databaseId?: number })[] = publicCamels.data
    ? publicCamels.data.map((camel) => ({
        id: camel.recordCode,
        databaseId: camel.id,
        name: camel.name,
        image: camel.imageUrl,
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
        note: camel.note,
      }))
    : camelRecords;
  const selectedCamelImages = useMemo(() => selectedCamel ? [selectedCamel.image, ...(selectedCamelPhotos.data?.map((photo) => photo.imageUrl) ?? [])] : [], [selectedCamel, selectedCamelPhotos.data]);
  const selectedCamelProductionPosts = useMemo(() => selectedCamel?.databaseId ? (publicContent.data ?? []).filter((item) => item.camelRecordId === selectedCamel.databaseId) : [], [publicContent.data, selectedCamel]);
  const filteredCamelProductionPosts = useMemo(() => selectedCamelProductionPosts.filter((item) => productionFilter === "all" || productionFilter === "news" ? (productionFilter === "all" || item.kind === "news" || item.kind === "announcement" || item.kind === "celebration") : item.kind === productionFilter), [productionFilter, selectedCamelProductionPosts]);
  const contentItems = publicContent.data ?? [];
  const celebrationItems = useMemo(() => contentItems.filter((item) => item.kind === "celebration").sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()), [contentItems]);
  const activeCelebration = useMemo(() => celebrationItems.find((item) => isCelebrationActive(item.publishedAt, celebrationClock)) ?? null, [celebrationClock, celebrationItems]);
  const latestAnnouncement = useMemo(() => contentItems.filter((item) => item.kind === "announcement").sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0] ?? null, [contentItems]);
  const archivedAnnouncementItems = useMemo(() => contentItems.filter((item) => item.kind === "announcement" || (item.kind === "celebration" && !isCelebrationActive(item.publishedAt, celebrationClock))).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()), [celebrationClock, contentItems]);
  const fieldUpdates = useMemo(() => contentItems.filter((item) => item.kind !== "announcement" && item.kind !== "celebration"), [contentItems]);
  const celebrationHoursRemaining = activeCelebration ? getCelebrationHoursRemaining(activeCelebration.publishedAt, celebrationClock) : 0;

  const closeMenu = () => setIsMenuOpen(false);
  const getReserveUrl = () => PUBLIC_SITE_URL;
  const getCamelPath = (camel: CamelRecord & { databaseId?: number }) => `/?camel=${encodeURIComponent(camel.id)}#herd`;
  const getCamelUrl = (camel: CamelRecord & { databaseId?: number }) => `${PUBLIC_SITE_URL}${getCamelPath(camel)}`;
  const getContentUrl = (item: PublicContentItem) => {
    const url = new URL(window.location.href);
    url.searchParams.set("post", String(item.id));
    return url.toString();
  };
  const getProductionUrl = (item: PublicContentItem) => `${PUBLIC_SITE_URL}/?post=${item.id}`;
  const closeContent = () => {
    setSelectedContent(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("post");
    window.history.replaceState({}, "", url.toString());
  };
  const closeCamel = () => {
    setSelectedCamel(null);
    setActiveCamelImage(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("camel");
    window.history.replaceState({}, "", url.toString());
  };
  const moveCamelGalleryImage = (direction: 1 | -1) => {
    if (!selectedCamelImages.length) return;
    const currentImage = activeCamelImage ?? selectedCamel?.image;
    const currentIndex = Math.max(0, selectedCamelImages.indexOf(currentImage ?? ""));
    const nextIndex = getCyclicGalleryIndex(currentIndex, selectedCamelImages.length, direction);
    if (nextIndex !== -1) setActiveCamelImage(selectedCamelImages[nextIndex]);
  };
  const openCamel = (camel: CamelRecord & { databaseId?: number }) => {
    setSelectedCamel(camel);
    setActiveCamelImage(camel.image);
    setProductionFilter("all");
    if (camel.databaseId) setGalleryInput({ camelRecordId: camel.databaseId });
    window.history.replaceState({}, "", getCamelPath(camel));
  };
  const openContent = (item: PublicContentItem) => {
    setSelectedContent(item);
    setContentEngagementInput({ contentItemId: item.id });
    setCommentBody("");
    setContentActionMessage("");
    window.history.replaceState({}, "", getContentUrl(item));
  };
  const shareContentItem = async (item: PublicContentItem) => {
    const url = getContentUrl(item);
    const shareData = { title: item.title, text: item.title, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setContentActionMessage("تم فتح خيارات المشاركة.");
      } else {
        await navigator.clipboard.writeText(url);
        setContentActionMessage("تم نسخ رابط المنشور للمشاركة.");
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
    if (!user) { startLogin(); return; }
    try {
      await toggleContentLike.mutateAsync({ contentItemId: selectedContent.id });
      await utils.content.engagement.invalidate(contentEngagementInput);
    } catch (error) {
      setContentActionMessage(error instanceof Error ? error.message : "تعذر تسجيل الإعجاب.");
    }
  };
  const submitComment = async () => {
    if (!selectedContent) return;
    if (!user) { startLogin(); return; }
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
    if (!postId || !publicContent.data || selectedContent?.id === postId) return;
    const sharedItem = publicContent.data.find((item) => item.id === postId);
    if (!sharedItem) return;
    setSelectedContent(sharedItem);
    setContentEngagementInput({ contentItemId: sharedItem.id });
  }, [publicContent.data, selectedContent?.id]);
  useEffect(() => {
    const camelCode = new URLSearchParams(window.location.search).get("camel");
    if (!camelCode || (selectedCamel?.id === camelCode && selectedCamel.databaseId)) return;
    const sharedCamel = camels.find((camel) => camel.id === camelCode);
    if (sharedCamel) openCamel(sharedCamel);
  }, [camels, selectedCamel?.id]);
  useEffect(() => {
    if (!activeCelebration) return;
    const expiresAt = new Date(activeCelebration.publishedAt).getTime() + CELEBRATION_WINDOW_MS;
    const timeout = window.setTimeout(() => setCelebrationClock(Date.now()), Math.max(250, expiresAt - Date.now() + 250));
    return () => window.clearTimeout(timeout);
  }, [activeCelebration]);
  const copyQrLink = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setQrStatus(`تم نسخ ${label}.`);
    } catch {
      setQrStatus("تعذر النسخ تلقائياً. استخدم زر المشاركة.");
    }
  };
  const shareQrLink = async (title: string, url: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        setQrStatus("تم فتح خيارات المشاركة.");
      } else {
        await copyQrLink(url, "الرابط");
      }
    } catch {
      setQrStatus("يمكنك نسخ الرابط أو مسح رمز QR.");
    }
  };
  const shareProductionItem = async (item: PublicContentItem) => {
    const url = getProductionUrl(item);
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text: item.title, url });
        setQrStatus("تم فتح خيارات المشاركة.");
      } else {
        await copyQrLink(url, "رابط مادة الإنتاج");
      }
    } catch {
      setQrStatus("يمكنك استخدام واتساب أو نسخ رابط مادة الإنتاج.");
    }
  };
  const shareReserveLink = async () => {
    const shareData = {
      title: reserve.reserveName,
      text: `اكتشف سجل الإبل وخدمات ${reserve.reserveName}.`,
      url: getReserveUrl(),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("تم فتح خيارات المشاركة");
      } else {
        await navigator.clipboard.writeText(getReserveUrl());
        setShareStatus("تم نسخ رابط المحمية");
      }
    } catch {
      setShareStatus("شارك رابط المحمية");
    }
  };
  const activeGalleryImage = selectedCamel ? activeCamelImage ?? selectedCamel.image : null;
  const isPrimaryGalleryImage = Boolean(selectedCamel && activeGalleryImage === selectedCamel.image);
  const selectedContentIsVideo = Boolean(selectedContent && (selectedContent.kind === "video" || selectedContent.durationSeconds !== null));

  return (
    <div className="site-shell" dir="rtl">
      <header className="site-header">
        <a href="#top" className="brand" aria-label={reserve.reserveName}>
          <img src="/manus-storage/zomool-mark_69b1a465.png" alt="رمز محمية زمول" />
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
        </nav>
      )}

      {activeCelebration && (
        <aside className="celebration-banner" aria-label="تهنئة أو مناسبة حديثة">
          <div className="celebration-lights" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <button type="button" onClick={() => openContent(activeCelebration)} aria-label={`فتح تهنئة ${activeCelebration.title}`}>
            <span className="celebration-icon"><Sparkles size={19} /></span>
            <span className="celebration-copy"><small>تهنئة أو مناسبة من المحمية</small><strong>{activeCelebration.title}</strong>{activeCelebration.body && <span className="celebration-body-window"><em className="celebration-body-track">{activeCelebration.body}</em></span>}</span>
            <span className="celebration-timer">متبقي {celebrationHoursRemaining} س</span>
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
              <span>لكل بعير حكاية</span>
              <strong>تُعرف باسمه</strong>
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
            <p>من رمال الإمارات</p>
            <span>٠١ / ٠١</span>
          </div>
          <div className="hero-line" />
        </section>

        <section className="mobile-hero-copy" aria-label="تعريف المحمية">
          <div className="hero-kicker">
            <span className="sun-dot" />
            سجل المحمية الرقمي
          </div>
          <div className="hero-title" role="heading" aria-level={1}>
            <span>لكل بعير حكاية</span>
            <strong>تُعرف باسمه</strong>
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
              صُمم هذا السجل ليجمع معلومات كل بعير في مكان واحد؛ بطاقة واضحة يراها المهتم، ويستطيع فريق المحمية تحديثها متى توفرت البيانات المعتمدة.
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
              <SectionLabel>سجل الإبل</SectionLabel>
              <h2>بطاقات تحفظ <em>قصة كل بعير</em></h2>
            </div>
            <p className="section-aside">سجل موحّد قابل لإضافة أي زمول جديد وتحديث الإنتاج والإنجازات والنسب والتواصل عند اعتماد البيانات.</p>
          </div>

          <div className="camel-grid">
            {camels.map((camel, index) => (
              <article className={`camel-card camel-card-${index + 1}`} key={camel.id}>
                <button type="button" className="camel-photo-wrap camel-photo-button" onClick={() => openCamel(camel)} aria-label={`فتح معرض صور ${camel.name}`}>
                  <img src={camel.image} alt={`صورة ${camel.name}`} className="camel-photo" style={{ objectPosition: `${camel.imagePositionX ?? 50}% ${camel.imagePositionY ?? 50}%`, transform: `scale(${(camel.imageScale ?? 100) / 100}) rotate(${camel.imageRotation ?? 0}deg)` }} />
                  <div className="photo-overlay" />
                  <span className="camel-number">{camel.id}</span>
                  {camel.databaseId && <span className="camel-photo-count"><Images size={14} /> {formatPhotoCount(1 + (camelPhotoCounts.data?.find((count) => count.camelRecordId === camel.databaseId)?.count ?? 0))}</span>}
                </button>
                <div className="camel-card-body">
                  <div className="camel-title-row">
                    <div>
                      <p>سجل ميداني موثق</p>
                      <h3>{camel.name}</h3>
                    </div>
                    <button className="round-action" aria-label={`عرض بطاقة ${camel.name}`} onClick={() => openCamel(camel)}>
                      <ChevronLeft size={22} />
                    </button>
                  </div>
                  <div className="record-state"><span /> حالة التوثيق: {camel.status}</div>
                  <div className="camel-meta">
                    <div><span>الأصل</span><strong>{camel.father} × {camel.mother}</strong></div>
                    <div><span>{camel.maternalSiblingLabel}</span><strong>{camel.maternalBrother}</strong></div>
                    <div><span>سجل الإنجاز</span><strong>{camel.achievements}</strong></div>
                    <div><span>بيانات الإنتاج</span><strong>{camel.production}</strong></div>
                    <div><span>الجهة</span><strong>{camel.owner}</strong></div>
                  </div>
                  <button className="view-profile" onClick={() => openCamel(camel)}>
                    فتح السجل والمعرض <ArrowUpLeft size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="template-note">
            <ClipboardList size={21} />
            <p><strong>سجل قابل للتحديث والتوسع.</strong> تُضاف بطاقة أي زمول جديد، وتُحدّث حقول الإنتاج والإنجازات والنسب والتواصل في مصدر بيانات موحد.</p>
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
                      <div className="update-card-media">
                        {item.kind === "video" ? item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={`معاينة فيديو ${item.title}`} /> : <video muted playsInline preload="metadata" src={item.mediaUrl} /> : <img src={item.mediaUrl} alt={item.title} />}
                        {item.kind === "video" && <span className="update-video-play" aria-hidden="true">▶</span>}
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

        {archivedAnnouncementItems.length > 0 && (
          <section className="announcement-archive" aria-label="أرشيف الإعلانات والتهاني">
            <div className="section-heading-row"><div><SectionLabel>أرشيف الإعلانات</SectionLabel><h2>إعلانات و<em>مناسبات موثقة</em></h2></div><p className="section-aside">تنتقل التهاني والمناسبات إلى هذا الأرشيف تلقائياً بعد 24 ساعة من ظهورها في أعلى الصفحة.</p></div>
            <div className="announcement-archive-list">
              {archivedAnnouncementItems.map((item) => <button type="button" key={item.id} onClick={() => openContent(item)}><span className={item.kind === "celebration" ? "archive-kind is-celebration" : "archive-kind"}>{item.kind === "celebration" ? "تهنئة أو مناسبة" : "إعلان"}</span><strong>{item.title}</strong><time dateTime={new Date(item.publishedAt).toISOString()}>{formatPublishedAt(item.publishedAt)}</time><ChevronLeft size={18} /></button>)}
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
              <a className="visit-detail" href={reserve.mapUrl} target="_blank" rel="noreferrer" aria-label="فتح موقع المحمية في الخرائط">
                <span className="detail-icon"><MapPin size={18} /></span>
                <div><small>موقع المحمية</small><strong>{reserve.locationName}</strong></div>
              </a>
              <a className="visit-detail" href={`tel:${reserve.phone.replace(/[^+\d]/g, "")}`} aria-label="الاتصال بالمسؤول">
                <span className="detail-icon"><Phone size={18} /></span>
                <div><small>رقم المسؤول</small><strong className="phone-number" dir="ltr">{reserve.phone}</strong></div>
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
            <a href="#contact-info" className="button-outline">متطلبات تفعيل التواصل <ArrowUpLeft size={17} /></a>
          </div>
          <div className="visit-stamp"><Sparkles size={15} /> زمول الخييلي</div>
        </section>

        <section className="contact-brief" id="contact-info">
          <div className="contact-seal"><ShieldCheck size={23} /><span>سجل موثق<br />عند تحديث البيانات</span></div>
          <div>
            <SectionLabel>الخطوة التالية</SectionLabel>
            <h2>أرسل المعلومات، <em>ونُكمل السجل.</em></h2>
          </div>
          <div className="contact-checklist">
            <p><Check size={16} /> صورة واضحة لكل بعير</p>
            <p><Check size={16} /> الاسم والسلالة والإنجازات</p>
            <p><Check size={16} /> الإنتاج وبيانات العامل</p>
            <p><Check size={16} /> رقم التواصل ورابط الموقع</p>
          </div>
        </section>
        <section className="qr-reserve-section" aria-label="رمز الوصول إلى معلومات المحمية">
          <div className="qr-reserve-copy"><SectionLabel>رمز الوصول السريع</SectionLabel><h2>امسح الرمز، <em>وافتح سجل المحمية.</em></h2><p>يوصل هذا الرمز مباشرة إلى معلومات المحمية وسجل الإبل والخدمات ووسائل التواصل من الموقع الرسمي.</p><div className="qr-reserve-actions"><button type="button" onClick={() => copyQrLink(getReserveUrl(), "رابط المحمية")}><Copy size={15} /> نسخ الرابط</button><button type="button" onClick={() => shareQrLink(reserve.reserveName, getReserveUrl())}><Share2 size={15} /> مشاركة الرابط</button></div>{qrStatus && <p role="status" className="qr-status">{qrStatus}</p>}</div>
          <div className="qr-code-card"><QRCodeSVG value={getReserveUrl()} size={156} level="M" includeMargin aria-label={`رمز QR لمعلومات ${reserve.reserveName}`} /><span><QrCode size={15} /> امسح بكاميرا الهاتف</span></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/manus-storage/zomool-mark_69b1a465.png" alt="رمز محمية زمول" />
          <p>{reserve.reserveName}</p>
        </div>
        <p>سجل رقمي خاص بالإبل والمعلومات الميدانية.</p>
        <a href="/admin">إدارة المحمية</a>
        <a href="#top">العودة إلى الأعلى ↑</a>
      </footer>

      {selectedCamel && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={closeCamel}>
          <section className="camel-dialog" role="dialog" aria-modal="true" aria-labelledby="camel-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="dialog-close" onClick={closeCamel} aria-label="إغلاق البطاقة"><X size={20} /></button>
            <div className="camel-dialog-media-stack">
              <div
                className={isPrimaryGalleryImage ? "dialog-image is-primary" : "dialog-image"}
                onTouchStart={(event) => { camelImageSwipeStartX.current = event.touches[0]?.clientX ?? null; }}
                onTouchEnd={(event) => {
                  const startX = camelImageSwipeStartX.current;
                  const endX = event.changedTouches[0]?.clientX;
                  camelImageSwipeStartX.current = null;
                  if (startX === null || endX === undefined || selectedCamelImages.length < 2) return;
                  const distance = endX - startX;
                  if (Math.abs(distance) < 42) return;
                  moveCamelGalleryImage(distance < 0 ? 1 : -1);
                }}
                onTouchCancel={() => { camelImageSwipeStartX.current = null; }}
                aria-label={selectedCamelImages.length > 1 ? "اسحب الصورة يميناً أو يساراً لتبديل صور البعير" : undefined}
              >
                <img
                  src={activeGalleryImage ?? selectedCamel.image}
                  alt={`صورة ${selectedCamel.name}`}
                  style={isPrimaryGalleryImage ? {
                    objectPosition: `${selectedCamel.imagePositionX ?? 50}% ${selectedCamel.imagePositionY ?? 50}%`,
                    transform: `scale(${(selectedCamel.imageScale ?? 100) / 100}) rotate(${selectedCamel.imageRotation ?? 0}deg)`,
                  } : undefined}
                />
                {selectedCamelImages.length > 1 && <span className="gallery-swipe-hint">اسحب يميناً أو يساراً للتبديل</span>}
              </div>
              <section className="camel-gallery camel-dialog-gallery" aria-label={`معرض صور ${selectedCamel.name}`}>
                <div className="camel-gallery-heading"><span><Images size={16} /> معرض الصور</span><strong>{formatPhotoCount(selectedCamelImages.length)}</strong></div>
                <div className="camel-gallery-thumbnails">
                  {selectedCamelImages.map((image, index) => <button key={`${image}-${index}`} type="button" className={image === (activeGalleryImage ?? selectedCamel.image) ? "is-active" : ""} onClick={() => setActiveCamelImage(image)} aria-label={`عرض الصورة ${index + 1} في مربع المعرض`}><img src={image} alt={`صورة ${index + 1} لـ ${selectedCamel.name}`} /></button>)}
                </div>
              </section>
            </div>
            <div className="dialog-content">
              <span className="dialog-id">{selectedCamel.id} / بطاقة تعريف</span>
              <h2 id="camel-dialog-title">{selectedCamel.name}</h2>
              <p className="dialog-note">{selectedCamel.note}</p>
              <div className="dialog-facts">
                <div><span>الأب</span><strong>{selectedCamel.father}</strong></div>
                <div><span>الأم</span><strong>{selectedCamel.mother}</strong></div>
                <div><span>{selectedCamel.maternalSiblingLabel}</span><strong>{selectedCamel.maternalBrother}</strong></div>
                <div><span>الحالة</span><strong>{selectedCamel.status}</strong></div>
                <div><span>الإنجازات</span><strong>{selectedCamel.achievements}</strong></div>
                <div><span>الإنتاج</span><strong>{selectedCamel.production}</strong></div>
                <div><span>الجهة</span><strong>{selectedCamel.owner}</strong></div>
                <div><span>العامل المسؤول</span><strong>{selectedCamel.worker}</strong></div>
                <div><span>رقم التواصل</span><strong>{selectedCamel.phone}</strong></div>
              </div>
              <div className="record-timeline" aria-label="مسار التوثيق">
                <span><i /> هوية البعير</span>
                <span><i /> السلالة والإنتاج</span>
                <span><i /> مسؤول التواصل</span>
              </div>
              <p className="dialog-disclaimer">هذه بطاقة نموذجية صُممت لاستقبال البيانات المعتمدة الخاصة بالمحمية.</p>
              {selectedCamelProductionLinks.isLoading && <p className="camel-production-empty">جارٍ تحميل روابط إنتاج {selectedCamel.name}...</p>}
              {selectedCamelProductionLinks.isError && <p role="alert" className="camel-production-empty">تعذر تحميل روابط الإنتاج حالياً. يمكنك المحاولة مرة أخرى بعد قليل.</p>}
              {selectedCamelProductionLinks.data && selectedCamelProductionLinks.data.length > 0 && <section className="camel-production-links" aria-label={`روابط إنتاج ${selectedCamel.name}`}><div className="camel-gallery-heading"><span><ExternalLink size={16} /> روابط إنتاج البعير</span><strong>{selectedCamelProductionLinks.data.length} روابط</strong></div><p className="camel-production-intro">روابط أصلية لإنتاج {selectedCamel.name} على المنصات الخارجية، وتُفتح من مصدرها مباشرة.</p><ol className="production-external-links">{selectedCamelProductionLinks.data.map((link, index) => <li key={link.id}><a href={link.url} target="_blank" rel="noreferrer"><span><b>{index + 1}. {link.title}</b><small>{link.platform} · تاريخ الربط: {formatLinkDate(link.linkedAt)}</small></span><ExternalLink size={17} /></a></li>)}</ol></section>}
              {selectedCamelProductionPosts.length > 0 && <section className="camel-production-posts" aria-label={`إنتاج ووسائط ${selectedCamel.name}`}><div className="camel-gallery-heading"><span><Send size={16} /> سجل إنتاج البعير</span><strong>{selectedCamelProductionPosts.length} مواد موثقة</strong></div><p className="camel-production-intro">صور وفيديوهات وأخبار مرتبطة بإنتاج {selectedCamel.name}. اضغط البطاقة لفتح المادة، أو استخدم واتساب والمشاركة لإرسال الرابط.</p><div className="production-filter-tabs" role="tablist" aria-label="تصفية سجل الإنتاج">{(["all", "video", "photo", "news"] as ProductionFilter[]).map((filter) => <button key={filter} type="button" role="tab" aria-selected={productionFilter === filter} className={productionFilter === filter ? "is-active" : ""} onClick={() => setProductionFilter(filter)}>{filter === "all" ? "الكل" : filter === "video" ? "الفيديوهات" : filter === "photo" ? "الصور" : "الأخبار"}</button>)}</div><div className="production-media-cards">{filteredCamelProductionPosts.map((item) => <article className="production-media-card" key={item.id}><button type="button" className="production-card-open" onClick={() => { closeCamel(); openContent(item); }}><div className="production-card-media">{item.mediaUrl ? item.kind === "video" ? item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={`معاينة فيديو ${item.title}`} /> : <video muted playsInline preload="metadata" src={item.mediaUrl} /> : <img src={item.mediaUrl} alt={item.title} /> : <span>مادة إنتاج موثقة</span>}<b>{item.kind === "announcement" ? "إعلان" : item.kind === "video" ? "فيديو إنتاج" : item.kind === "photo" ? "صورة إنتاج" : "خبر إنتاج"}</b>{item.kind === "video" && <i className="production-video-play" aria-hidden="true">▶</i>}{item.kind === "video" && item.durationSeconds !== null && <i className="production-video-duration">{formatMediaDuration(item.durationSeconds)}</i>}</div><div className="production-card-body"><h3>{item.title}</h3>{item.body && <p>{item.body}</p>}<div className="production-lineage"><span>البعير <strong>{selectedCamel.name}</strong></span><span>الأب <strong>{selectedCamel.father}</strong></span><span>الأم <strong>{selectedCamel.mother}</strong></span></div><p className="production-record"><b>بيانات الإنتاج:</b> {selectedCamel.production}</p><small>من إنتاج {selectedCamel.name} · نُشر في {formatPublishedAt(item.publishedAt)}</small></div></button><div className="production-card-actions"><a href={`https://wa.me/?text=${encodeURIComponent(`${item.title} — ${getProductionUrl(item)}`)}`} target="_blank" rel="noreferrer">واتساب</a><button type="button" onClick={() => shareProductionItem(item)}><Share2 size={15} /> مشاركة</button><button type="button" onClick={() => copyQrLink(getProductionUrl(item), "رابط مادة الإنتاج")}><Copy size={15} /> نسخ الرابط</button></div></article>)}</div>{filteredCamelProductionPosts.length === 0 && <p className="camel-production-empty">لا توجد مواد ضمن هذا التصنيف لهذا البعير بعد.</p>}</section>}
              {selectedCamelProductionPosts.length === 0 && !selectedCamelProductionLinks.isLoading && !selectedCamelProductionLinks.isError && (!selectedCamelProductionLinks.data || selectedCamelProductionLinks.data.length === 0) && <p className="camel-production-empty">لا توجد روابط إنتاج أو صور أو فيديوهات منشورة لهذا البعير بعد. يمكن للإدارة لصق رابط إنتاجه من بطاقة البعير في لوحة الإدارة.</p>}
              <section className="camel-qr-card" aria-label={`رمز QR لبطاقة ${selectedCamel.name}`}><div><span className="dialog-id">بطاقة QR تعريفية</span><strong>امسح الرمز لفتح سجل {selectedCamel.name}</strong><small>يشمل الهوية والنسب والإنجازات والإنتاج والصور والوسائط المرتبطة.</small><div className="camel-qr-actions"><button type="button" onClick={() => copyQrLink(getCamelUrl(selectedCamel), `رابط ${selectedCamel.name}`)}><Copy size={13} /> نسخ الرابط</button><button type="button" onClick={() => shareQrLink(`بطاقة ${selectedCamel.name}`, getCamelUrl(selectedCamel))}><Share2 size={13} /> مشاركة</button></div>{qrStatus && <p role="status" className="qr-status">{qrStatus}</p>}</div><div className="camel-qr-code"><QRCodeSVG value={getCamelUrl(selectedCamel)} size={112} level="M" includeMargin aria-label={`رمز QR لسجل ${selectedCamel.name}`} /></div></section>
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
                {selectedContentIsVideo ? <video controls autoPlay playsInline preload="metadata" src={selectedContent.mediaUrl} /> : <img src={selectedContent.mediaUrl} alt={selectedContent.title} />}
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
              <div className="content-share-links"><a href={`https://wa.me/?text=${encodeURIComponent(`${selectedContent.title} — ${getContentUrl(selectedContent)}`)}`} target="_blank" rel="noreferrer">واتساب</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getContentUrl(selectedContent))}`} target="_blank" rel="noreferrer">فيسبوك</a><a href={`https://x.com/intent/post?text=${encodeURIComponent(`${selectedContent.title} ${getContentUrl(selectedContent)}`)}`} target="_blank" rel="noreferrer">X</a><button type="button" onClick={shareContent}><Copy size={13} /> نسخ الرابط</button></div>
              <section className="content-comments" aria-label="التعليقات"><div className="content-comments-heading"><span><MessageCircle size={17} /> التعليقات</span><strong>{selectedContentEngagement.data?.comments.length ?? 0}</strong></div>{user ? <div className="comment-form"><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength={1000} placeholder="اكتب تعليقاً محترماً حول هذا المنشور..." /><button type="button" onClick={submitComment} disabled={addContentComment.isPending}>{addContentComment.isPending ? "جارٍ النشر..." : "نشر التعليق"}</button></div> : <button type="button" className="comment-login" onClick={startLogin}>سجّل الدخول لإضافة إعجاب أو تعليق</button>}<div className="comments-list">{selectedContentEngagement.data?.comments.map((comment) => <article key={comment.id}><strong>{comment.authorName || "زائر المحمية"}</strong><time>{formatPublishedAt(comment.createdAt)}</time><p>{comment.body}</p></article>)}{!selectedContentEngagement.isLoading && selectedContentEngagement.data?.comments.length === 0 && <p className="comments-empty">لا توجد تعليقات بعد. كن أول من يشارك رأيه.</p>}</div></section>
              {contentActionMessage && <p role="status" className="content-action-message">{contentActionMessage}</p>}
              <button className="content-dialog-close" type="button" onClick={closeContent}>إغلاق التفاصيل</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
