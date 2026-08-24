"use client";

import { useCallback, useEffect, useState } from "react";
import {
  canInstall,
  initInstallPrompt,
  onInstallabilityChange,
  promptInstall,
} from "@/lib/install";
import { isAndroid, isStandalone } from "@/lib/device";

// Fallback to the brand color used in the manifest/onboarding when the page
// does not provide its own branding.
const DEFAULT_BRAND_COLOR = "#53593D";

/**
 * Native install banner (Android Chrome). Shows immediately on Android so the
 * user always has an install affordance, without waiting for Chrome's 30s + 1
 * tap engagement heuristic. When tapped:
 *  - if `beforeinstallprompt` has fired, it triggers the native install prompt;
 *  - otherwise it shows a hint with the alternative path (keep the app open a
 *    few seconds, or use Chrome's ⋮ → "Add to Home screen").
 */
export default function InstallBanner({
  primaryColor = DEFAULT_BRAND_COLOR,
}: {
  primaryColor?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setMounted(true);
    initInstallPrompt();
    return onInstallabilityChange(setInstallable);
  }, []);

  // Once Chrome fires `beforeinstallprompt` the native path is ready — clear a
  // stale hint so the button can be tapped again for the real dialog.
  useEffect(() => {
    if (installable) setShowHint(false);
  }, [installable]);

  const handleInstall = useCallback(async () => {
    if (!canInstall()) {
      setShowHint(true);
      return;
    }
    setShowHint(false);
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  }, []);

  // Render only on the client (avoids hydration mismatch) and only on Android,
  // and never when already running as an installed PWA.
  if (!mounted || !isAndroid() || isStandalone() || dismissed) return null;

  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ backgroundColor: primaryColor }}
      >
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-white text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          {installing ? "Instalando…" : "Instalar app"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Cerrar"
          className="p-1.5 text-white/80 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {showHint && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <p className="text-sm text-gray-700 leading-snug">
            La app ya se puede instalar. Mantén la página abierta unos segundos
            y toca <strong>Instalar app</strong> de nuevo, o usa el menú{" "}
            <strong>⋮ → Añadir a pantalla de inicio</strong>.
          </p>
          <button
            onClick={() => setShowHint(false)}
            className="mt-2 text-xs font-semibold"
            style={{ color: primaryColor }}
          >
            Entendido
          </button>
        </div>
      )}
    </div>
  );
}
