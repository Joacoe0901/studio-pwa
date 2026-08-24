import { isIOS, isAndroid, isStandalone } from "./device";

// ─── Install-prompt (first access) helpers ──────────────────────────────────
// Controls the one-time modal that guides mobile users to add the web app to
// their home screen so it behaves like a native app.

const SEEN_KEY = "installPromptSeen";

export type InstallPromptVariant = "ios" | "android";

export function hasSeenInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markInstallPromptSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEEN_KEY, "true");
  } catch {
    // ignore (private mode / quota) — worst case it shows again next time
  }
}

/** Which install-guide variant to show, or null when it should not appear:
 *  - only on mobile (iOS / Android),
 *  - never when already running standalone (already installed),
 *  - never after the user has dismissed it once. */
export function getInstallPromptVariant(): InstallPromptVariant | null {
  if (typeof window === "undefined") return null;
  if (hasSeenInstallPrompt()) return null;
  if (isStandalone()) return null;
  if (isIOS()) return "ios";
  if (isAndroid()) return "android";
  return null;
}
