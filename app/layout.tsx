import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Andes Pilates",
  description: "Tu espacio de bienestar",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/andes_logo_pwa.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Andes Pilates",
  },
};

export const viewport: Viewport = {
  themeColor: "#4A7C59",
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
        <link rel="apple-touch-icon" href="/andes_logo_pwa.png" />
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

  // ── Fetch fresh branding from API in background (aggressive retry) ──
  // Runs in parallel with React — never gives up, keeps retrying with
  // exponential backoff. On success updates localStorage + CSS vars and
  // dispatches 'branding-updated' so React components can refresh.
  window.__API_URL = '${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"}';
  (function fetchBranding(attempt) {
    attempt = attempt || 0;
    var token = localStorage.getItem('accessToken');
    if (!token) {
      if (attempt < 12) setTimeout(function() { fetchBranding(attempt + 1); }, Math.min(1000 * Math.pow(1.5, attempt), 30000));
      return;
    }
    var apiUrl = window.__API_URL || (window.location.origin + '/api/v1');
    fetch(apiUrl + '/client/company', { headers: { Authorization: 'Bearer ' + token } })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        if (data && data.primaryColor && data.secondaryColor) {
          var branding = {};
          try { var c = JSON.parse(localStorage.getItem('studioBranding')); if (c) branding = c; } catch(e) {}
          Object.keys(data).forEach(function(k) { branding[k] = data[k]; });
          localStorage.setItem('studioBranding', JSON.stringify(branding));
          document.documentElement.style.setProperty('--brand-primary', data.primaryColor);
          document.documentElement.style.setProperty('--brand-secondary', data.secondaryColor);
          document.documentElement.style.setProperty(
            '--brand-bg-image',
            data.backgroundImageUrl ? 'url(' + data.backgroundImageUrl + ')' : 'none'
          );
          var meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute('content', data.primaryColor);
          window.dispatchEvent(new CustomEvent('branding-updated', { detail: branding }));
        } else if (attempt < 12) {
          setTimeout(function() { fetchBranding(attempt + 1); }, Math.min(1000 * Math.pow(1.5, attempt), 30000));
        }
      })
      .catch(function() {
        if (attempt < 12) setTimeout(function() { fetchBranding(attempt + 1); }, Math.min(1000 * Math.pow(1.5, attempt), 30000));
      });
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