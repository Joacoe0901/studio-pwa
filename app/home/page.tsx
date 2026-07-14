"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearToken, getAccessToken, resolveUploadUrl } from "@/lib/api";
import NotificationsBottomSheet from "@/components/NotificationsBottomSheet";
import NotificationDetailModal from "@/components/NotificationDetailModal";

interface StudioBranding {
  studioName: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundImageUrl: string;
  logoUrl: string;
}

interface ClientProfile {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
}

interface Notification {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

interface GridCard {
  label: string;
  subtitle: string;
  href: string;
  iconPath: string;
}

/* ─── Primary CTA: full-width card ─────────────────────────────────────────── */
const primaryCard: GridCard = {
  label: "Reservar Clase",
  subtitle: "¡Reserva ya!",
  href: "/reservar",
  iconPath:
    "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
};

/* ─── Secondary cards: 2×2 grid ───────────────────────────────────────────── */
const secondaryCards: GridCard[] = [
  {
    label: "Mis Clases",
    subtitle: "Ver horarios y reservas",
    href: "/mis-clases",
    iconPath:
      "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
  },
  {
    label: "Bonos",
    subtitle: "Tus sesiones disponibles",
    href: "/bonos",
    iconPath:
      "M13.75 16.5a1.88 1.88 0 0 1-.635.303v-2.663c.24.088.459.204.635.353.317.253.43.535.43.757 0 .222-.113.504-.43.757a1.88 1.88 0 0 1-.635.303Zm-3.5-6.75a1.88 1.88 0 0 1 .635-.303v2.663c-.24-.088-.459-.204-.635-.353C9.933 11.504 9.82 11.222 9.82 11c0-.222.113-.504.43-.757a1.88 1.88 0 0 1 .635-.303ZM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 3.719a.75.75 0 0 0-1.5 0v.847a3.836 3.836 0 0 0-1.72.756C8.818 8.138 8.418 8.922 8.418 9.848c0 .926.4 1.71 1.112 2.276.348.277.743.497 1.172.61v3.22a1.64 1.64 0 0 1-.522-.158c-.259-.14-.449-.291-.585-.432a.75.75 0 0 0-1.17.938c.258.32.596.588 1.013.808.417.22.89.364 1.364.42V18a.75.75 0 0 0 1.5 0v-.648a3.836 3.836 0 0 0 1.72-.756c.712-.566 1.112-1.35 1.112-2.276 0-.926-.4-1.71-1.112-2.276a3.837 3.837 0 0 0-1.172-.61V8.02a1.64 1.64 0 0 1 .522.158c.259.14.449.291.585.432a.75.75 0 0 0 1.17-.938 3.836 3.836 0 0 0-1.013-.808 3.835 3.835 0 0 0-1.364-.42V5.97Z",
  },
  {
    label: "Perfil",
    subtitle: "Tus datos personales",
    href: "/perfil",
    iconPath:
      "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
  },
  {
    label: "Empresa",
    subtitle: "Info del estudio",
    href: "/empresa",
    iconPath:
      "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
  },
];

const hamburgerItems = [
  {
    label: "Horarios",
    href: "/horarios",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
  },
  {
    label: "Términos y Condiciones",
    href: "/terminos",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  },
];


export default function HomePage() {
  const router = useRouter();

  const [branding, setBranding] = useState<StudioBranding>({
    studioName: "Andes Pilates",
    primaryColor: "#3B82F6",
    secondaryColor: "#8B5CF6",
    backgroundImageUrl: "",
    logoUrl: "",
  });
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  /* ─── Notifications state ──────────────────────────────────────────────── */
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailNotification, setDetailNotification] = useState<Notification | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [badgeAnimating, setBadgeAnimating] = useState(false);
  const prevUnreadRef = useRef<number>(0);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(() => {
    apiFetch<Notification[]>("/client/notifications")
      .then((data) => setNotifications(data))
      .catch(() => { });
  }, []);

  const markRead = useCallback((id: number) => {
    apiFetch(`/client/notifications/${id}/read`, { method: "POST" }).catch(() => { });
  }, []);

  /* ─── Trigger badge animation on count change ──────────────────────────── */
  useEffect(() => {
    if (prevUnreadRef.current !== unreadCount && unreadCount > 0) {
      setBadgeAnimating(true);
      const t = setTimeout(() => setBadgeAnimating(false), 350);
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }

    apiFetch<StudioBranding>("/client/company")
      .then((data) => setBranding(data))
      .catch(() => { });

    apiFetch<ClientProfile>("/client/me")
      .then((data) => setProfile(data))
      .catch(() => { });

    /* Fetch notifications on mount */
    loadNotifications();
  }, [router, loadNotifications]);

  /* ─── Poll notifications every 60s so new messages appear without reload ── */
  useEffect(() => {
    const t = setInterval(loadNotifications, 60000);
    return () => clearInterval(t);
  }, [loadNotifications]);

  const handleLogout = useCallback(() => {
    clearToken();
    router.replace("/login");
  }, [router]);

  /* ─── Notification handlers ────────────────────────────────────────────── */
  const handleOpenSheet = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const handleSelectNotification = useCallback((notification: Notification) => {
    setDetailNotification(notification);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    if (detailNotification) {
      const id = detailNotification.id;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      markRead(id);
    }
    setDetailOpen(false);
    setDetailNotification(null);
  }, [detailNotification, markRead]);

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "";
  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <div className="h-dvh flex flex-col" style={{ backgroundColor: "#F9F9F9" }}>
      {/* Header — fixed, white background */}
      <header className="flex-shrink-0 z-20 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="w-[45%] max-w-[180px]">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="w-full h-auto max-h-[clamp(30px,5.5dvh,48px)] object-contain" />
            ) : (
              <img src="/logo.png" alt="Logo" className="w-full h-auto max-h-[clamp(30px,5.5dvh,48px)] object-contain" />
            )}
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
            aria-label="Menú"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none" stroke="currentColor" strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero section — capped height */}
      <div className="flex-shrink-0 px-4 pt-3">
        <div
          className="w-full h-[clamp(90px,17dvh,180px)] rounded-2xl overflow-hidden bg-cover bg-center"
          style={
            branding.backgroundImageUrl
              ? { backgroundImage: `url(${branding.backgroundImageUrl})` }
              : { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }
          }
        />
      </div>

      {/* Navigation — Flex layout filling remaining space */}
      <main className="flex-1 min-h-0 px-4 pt-3 pb-2 flex flex-col">
        {/* CTA — double height */}
        <button
          onClick={() => router.push(primaryCard.href)}
          className="flex-shrink-0 w-full relative rounded-2xl py-[clamp(14px,2.2dvh,34px)] px-6 text-left active:scale-[0.98] transition-transform mb-[clamp(8px,1.5dvh,12px)]"
          style={{ backgroundColor: branding.secondaryColor, boxShadow: "0 4px 16px rgba(74,124,89,0.10)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex-shrink-0 w-[clamp(52px,8.5dvh,80px)] h-[clamp(52px,8.5dvh,80px)] rounded-xl flex items-center justify-center"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <svg className="w-[clamp(26px,4.2dvh,40px)] h-[clamp(26px,4.2dvh,40px)] text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={primaryCard.iconPath} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-[clamp(1.1rem,2.4dvh,1.25rem)] text-gray-900">{primaryCard.label}</h3>
              <p className="text-sm text-brand-600 mt-1">{primaryCard.subtitle}</p>
            </div>
            <svg className="w-5 h-5 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </button>

        {/* 2×2 grid — fills remaining space */}
        <div className="grid grid-cols-2 gap-[clamp(8px,1.5dvh,12px)] flex-1 min-h-0 auto-rows-fr">
          {secondaryCards.map((card) => (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              className="relative bg-white rounded-2xl p-[clamp(8px,1.5dvh,16px)] min-h-0 active:scale-[0.98] transition-transform flex flex-col items-center justify-center gap-[clamp(6px,1.2dvh,12px)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}
            >
              <div
                className="flex-shrink-0 w-[clamp(40px,7dvh,52px)] h-[clamp(40px,7dvh,52px)] rounded-xl flex items-center justify-center"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <svg
                  className="w-[clamp(22px,3.6dvh,28px)] h-[clamp(22px,3.6dvh,28px)] text-white"
                  fill="none" stroke="currentColor" strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.iconPath} />
                </svg>
              </div>
              <h3 className="font-extrabold text-[clamp(0.8rem,1.9dvh,1rem)] leading-tight text-center text-gray-900">{card.label}</h3>
            </button>
          ))}
        </div>

        {/* Notification button — centered, fits its content (icon + label) */}
        <div className="flex-shrink-0 mt-[clamp(8px,1.5dvh,12px)] flex justify-center">
          <button
            onClick={handleOpenSheet}
            className="relative inline-flex items-center gap-2.5 rounded-2xl px-5 py-[clamp(10px,1.6dvh,14px)] active:scale-[0.98] transition-transform"
            style={{ backgroundColor: branding.secondaryColor, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}
          >
            <div className="relative flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke={branding.primaryColor} strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className={`absolute -top-1 -right-2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold leading-none ${badgeAnimating ? "animate-badge-pop" : "transition-all duration-300"}`}>
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="font-semibold text-sm text-gray-900">Notificaciones</span>
          </button>
        </div>
      </main>

      {/* Hamburger menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="w-72 bg-white h-full shadow-xl flex flex-col">
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile section */}
            <div className="flex flex-col items-center px-6 pb-4">
              {profile?.profileImage ? (
                <img
                  src={resolveUploadUrl(profile.profileImage)}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-full text-white flex items-center justify-center text-2xl font-bold shadow-sm"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {initials}
                </div>
              )}
              <p className="mt-3 text-base font-semibold text-gray-900 text-center">
                {fullName || "Cargando..."}
              </p>
            </div>

            {/* Divider */}
            <div className="mx-6 border-t border-gray-100" />

            {/* Navigation items */}
            <nav className="flex-1 px-4 pt-3 space-y-1 overflow-y-auto">
              {hamburgerItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(item.href);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout button at bottom */}
            <div className="px-4 pb-6 pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Notifications Bottom Sheet ────────────────────────────────── */}
      <NotificationsBottomSheet
        open={sheetOpen}
        notifications={notifications}
        onClose={handleCloseSheet}
        onSelectNotification={handleSelectNotification}
      />

      {/* ─── Notification Detail Modal ─────────────────────────────────── */}
      {detailOpen && detailNotification && (
        <NotificationDetailModal
          notification={detailNotification}
          onClose={handleCloseDetail}
        />
      )}

    </div>
  );
}