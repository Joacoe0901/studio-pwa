// ─── Device & platform detection ─────────────────────────────────────────────
// Small, dependency-free helpers to detect the running platform and whether the
// PWA is already running as an installed (standalone) app.

/** True when running on an iPhone, iPod or iPad (includes iPadOS 13+ which
 *  reports a desktop "MacIntel" user agent but has touch). */
export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPod/i.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;
  // iPadOS 13+ masquerades as macOS — detect via touch points.
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    return true;
  }
  return false;
}

/** True when running on Android (mobile). */
export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** True when the app is already installed and running standalone (no browser
 *  chrome). iOS Safari exposes `navigator.standalone`; Chrome/Android uses the
 *  `display-mode: standalone` media query. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  try {
    return window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}
