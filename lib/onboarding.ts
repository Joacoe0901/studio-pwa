import { isIOS, isAndroid, isStandalone } from "./device";
import { getNotificationPermission, isPushSupported } from "./push";

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

// ─── Push-notification opt-in prompt (first login, mobile) ─────────────────
// One-time modal offering to enable push notifications. Shows only on mobile,
// when push is supported, the permission is still undecided, and the user has
// not dismissed it before.

const PUSH_PROMPT_SEEN_KEY = "pushPromptSeen";

export function hasSeenPushPrompt(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PUSH_PROMPT_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markPushPromptSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PUSH_PROMPT_SEEN_KEY, "true");
  } catch {
    // ignore (private mode / quota) — worst case it shows again next time
  }
}

/** Whether to offer the push opt-in modal right now. */
export function shouldShowPushPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (!isPushSupported()) return false;
  if (hasSeenPushPrompt()) return false;
  if (!isIOS() && !isAndroid()) return false;
  if (getNotificationPermission() !== "default") return false;
  return true;
}
