import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

// Resolves the studio's custom app icon from the public /settings endpoint.
// Uses ISR (revalidate every 5 min) so pages keep being statically served while
// the icon picks up changes shortly after the manager saves them. A short
// timeout protects the render/build from slow or cold backends; 5s is generous
// enough for a warm VPS backend but avoids falling back to the old logo on a
// brief slowdown (the manifest route fetches /settings with no timeout and
// resolves the icon reliably, so this should match it).
async function getAppIconUrl(): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_URL}/settings`, {
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.appIconUrl === "string" && data.appIconUrl.trim() !== ""
      ? data.appIconUrl
      : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const appIconUrl = await getAppIconUrl();
  return {
    title: "Andes Pilates",
    description: "Tu espacio de bienestar",
    manifest: "/manifest.json",
    icons: {
      icon: appIconUrl ?? "/favicon.png",
      apple: appIconUrl ?? "/andes_logo_pwa.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Andes Pilates",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#53593D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
// Capture the native install prompt as early as possible (before React hydrates)
// so we don't miss it when Chrome fires it on any page (e.g. /login). The
// library in lib/install.ts adopts it from window.__beforeInstallPrompt.
window.__beforeInstallPrompt = null;
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  window.__beforeInstallPrompt = e;
});
`,
          }}
        />
      </head>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});

  // ── Inject branding CSS custom properties from localStorage ──
  // Runs before React mounts, so the correct colours are available immediately.
  try {
    var branding = JSON.parse(localStorage.getItem('studioBranding'));
    if (branding) {
      if (branding.primaryColor) {
        document.documentElement.style.setProperty('--brand-primary', branding.primaryColor);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', branding.primaryColor);
      }
      if (branding.secondaryColor) {
        document.documentElement.style.setProperty('--brand-secondary', branding.secondaryColor);
      }
      if (branding.backgroundImageUrl) {
        document.documentElement.style.setProperty('--brand-bg-image', 'url(' + branding.backgroundImageUrl + ')');
      }
    }
  } catch(e) {}

  // ── Pre-fetch branding from API before React mounts ──
  // This runs in the background; React will pick up the result from localStorage.
  // On cold starts the SW may throttle /api/* requests with a 10 s timeout,
  // but the /client/company route is configured as NetworkOnly (no timeout).
  (function prefetchBranding() {
    var token = localStorage.getItem('accessToken');
    if (!token) return;
    var apiBase = '${process.env.NEXT_PUBLIC_API_URL}';
    fetch(apiBase + '/client/company', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (!data || !data.primaryColor) return;
      document.documentElement.style.setProperty('--brand-primary', data.primaryColor);
      document.documentElement.style.setProperty('--brand-secondary', data.secondaryColor);
      document.documentElement.style.setProperty(
        '--brand-bg-image',
        data.backgroundImageUrl ? 'url(' + data.backgroundImageUrl + ')' : 'none'
      );
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', data.primaryColor);
      localStorage.setItem('studioBranding', JSON.stringify(data));
    })
    .catch(function() {});
  })();

  // ── BroadcastChannel (most reliable SW ⇄ main thread messaging) ──
  if ('BroadcastChannel' in window) {
    var bc = new BroadcastChannel('studio-push');
    bc.addEventListener('message', function(event) {
      if (!event.data) return;
      // NOTIFICATION_CLICK: compare only pathname to avoid unnecessary reloads.
      if (event.data.type === 'NOTIFICATION_CLICK' && event.data.url) {
        var targetUrl = event.data.url;
        try {
          var target = new URL(targetUrl, window.location.origin);
          var current = new URL(window.location.href);
          if (target.pathname === current.pathname) {
            // Same page – just fire the event, no reload needed.
            window.dispatchEvent(new CustomEvent('push-click'));
            if (target.searchParams.get('openNotifications') === 'true') {
              window.dispatchEvent(new CustomEvent('open-notifications-sheet'));
            }
          } else {
            window.location.href = targetUrl;
          }
        } catch(e) {
          // Fallback: simple string compare
          var currentPath = window.location.pathname + window.location.search;
          if (targetUrl === currentPath) {
            window.dispatchEvent(new CustomEvent('push-click'));
          } else {
            window.location.href = targetUrl;
          }
        }
      }
      // NEW_NOTIFICATION: refresh badge
      if (event.data.type === 'NEW_NOTIFICATION') {
        window.dispatchEvent(new CustomEvent('new-notification'));
      }
    });
  }

  // ── Fallback: classic service worker message listener ──
  navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK' && event.data.url) {
      var targetUrl = event.data.url;
      try {
        var target = new URL(targetUrl, window.location.origin);
        var current = new URL(window.location.href);
        if (target.pathname === current.pathname) {
          window.dispatchEvent(new CustomEvent('push-click'));
          if (target.searchParams.get('openNotifications') === 'true') {
            window.dispatchEvent(new CustomEvent('open-notifications-sheet'));
          }
        } else {
          window.location.href = targetUrl;
        }
      } catch(e) {
        var currentPath = window.location.pathname + window.location.search;
        if (targetUrl === currentPath) {
          window.dispatchEvent(new CustomEvent('push-click'));
        } else {
          window.location.href = targetUrl;
        }
      }
    }
    if (event.data && event.data.type === 'NEW_NOTIFICATION') {
      window.dispatchEvent(new CustomEvent('new-notification'));
    }
  });
}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}