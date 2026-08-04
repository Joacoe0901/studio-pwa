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

  // ── BroadcastChannel (most reliable SW ⇄ main thread messaging) ──
  if ('BroadcastChannel' in window) {
    var bc = new BroadcastChannel('studio-push');
    bc.addEventListener('message', function(event) {
      if (!event.data) return;
      // NOTIFICATION_CLICK: navigate or stay
      if (event.data.type === 'NOTIFICATION_CLICK' && event.data.url) {
        var targetUrl = event.data.url;
        var currentPath = window.location.pathname + window.location.search;
        if (targetUrl === currentPath) {
          window.dispatchEvent(new CustomEvent('push-click'));
        } else {
          window.location.href = targetUrl;
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
      var currentPath = window.location.pathname + window.location.search;
      if (targetUrl === currentPath) {
        window.dispatchEvent(new CustomEvent('push-click'));
      } else {
        window.location.href = targetUrl;
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