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

  // Listen for notification click messages from the Service Worker.
  // When the user taps a push notification, the SW posts a message
  // with the target URL so the open PWA window can navigate.
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK' && event.data.url) {
      window.location.href = event.data.url;
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