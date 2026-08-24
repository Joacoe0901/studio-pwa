// ─── Native install (PWA) helpers ─────────────────────────────────────────────
// Captures the browser's `beforeinstallprompt` event so the app can show its own
// "Instalar" button and trigger the native install dialog. Chrome on Android no
// longer shows an automatic install prompt, so this is required to offer an
// in-app install button.

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __beforeInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let initialized = false;
let listeners: Array<(installable: boolean) => void> = [];

function notify(): void {
  const installable = canInstall();
  listeners.forEach((cb) => cb(installable));
}

/** True when the native install prompt is available and the app is not yet
 *  installed. */
export function canInstall(): boolean {
  return deferredPrompt !== null && !installed;
}

/** Subscribes to installability changes (fires immediately with current value).
 *  Returns an unsubscribe function. */
export function onInstallabilityChange(
  cb: (installable: boolean) => void
): () => void {
  listeners.push(cb);
  cb(canInstall());
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

/** Registers the `beforeinstallprompt` / `appinstalled` listeners (idempotent).
 *  Call once on the client. */
export function initInstallPrompt(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  // The prompt may have already fired on a previous page (e.g. /login) and been
  // stashed by the inline <head> script in app/layout.tsx; adopt it now so the
  // current page reacts to it immediately.
  if (window.__beforeInstallPrompt && !deferredPrompt) {
    deferredPrompt = window.__beforeInstallPrompt;
    notify();
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    // Suppress the default prompt and keep the event so our button can trigger
    // it later.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.__beforeInstallPrompt = deferredPrompt;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    window.__beforeInstallPrompt = null;
    notify();
  });
}

/** Triggers the native install prompt. Resolves true when the user accepts. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  window.__beforeInstallPrompt = null;
  notify();
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice.outcome === "accepted";
  } catch {
    return false;
  }
}
