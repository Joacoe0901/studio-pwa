import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  customWorkerSrc: "lib/sw",
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // The web app manifest must always be fetched fresh (it carries the
        // custom app icon). Without this, the default `.json` NetworkFirst
        // route would cache /manifest.json for 24 h and could serve a stale
        // icon after the studio changes it.
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && url.pathname === "/manifest.json",
        handler: "NetworkOnly",
        options: {
          cacheName: "manifest",
        },
      },
      {
        // Branding API must never be timed out by the SW — cold backends
        // can take 15-30 s to respond. Registered BEFORE the generic /api/*
        // NetworkFirst route so it takes precedence.
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin &&
          url.pathname.startsWith("/api/") &&
          url.pathname.includes("/client/company"),
        handler: "NetworkOnly",
        options: {
          cacheName: "branding-api",
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' http://localhost:3000 https://admin.andespilates.com",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
