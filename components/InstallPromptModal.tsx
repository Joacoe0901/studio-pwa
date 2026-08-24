"use client";

import { useRef, useState } from "react";
import type { InstallPromptVariant } from "@/lib/onboarding";

interface Slide {
  src: string;
  alt: string;
}

// Single source of truth for the guide images. Replace the files in
// public/onboarding/ when the real photos are available (same names → no code
// change required).
const SLIDES: Record<InstallPromptVariant, Slide[]> = {
  ios: [
    { src: "/onboarding/ios-1.png", alt: "Paso 1: abre Compartir" },
    { src: "/onboarding/ios-2.png", alt: "Paso 2: Añadir a pantalla de inicio" },
  ],
  android: [
    { src: "/onboarding/android.png", alt: "Instala la app en tu Android" },
  ],
};

const TITLES: Record<InstallPromptVariant, string> = {
  ios: "Instala la app en tu iPhone",
  android: "Instala la app en tu Android",
};

const SUBTITLES: Record<InstallPromptVariant, string> = {
  ios: "Guárdala en tu pantalla de inicio para usarla como una app.",
  android: "Guárdala en tu pantalla de inicio para usarla como una app.",
};

interface InstallPromptModalProps {
  variant: InstallPromptVariant;
  onClose: () => void;
  onInstall?: () => void;
  installable?: boolean;
  primaryColor: string;
}

export default function InstallPromptModal({
  variant,
  onClose,
  onInstall,
  installable,
  primaryColor,
}: InstallPromptModalProps) {
  const slides = SLIDES[variant];
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== index) setIndex(next);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm max-h-[85dvh] bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">
              {TITLES[variant]}
            </h2>
            <p className="mt-1 text-sm text-gray-500 leading-snug">
              {SUBTITLES[variant]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Carousel */}
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {slides.map((slide) => (
            <div key={slide.src} className="w-full flex-shrink-0 snap-center px-5">
              <img
                src={slide.src}
                alt={slide.alt}
                className="w-full max-h-[52dvh] object-contain rounded-xl bg-gray-100"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Dots */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-3">
            {slides.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: i === index ? "1.25rem" : "0.375rem",
                  backgroundColor: i === index ? primaryColor : "#D1D5DB",
                }}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-5 space-y-2">
          {variant === "android" && installable && onInstall ? (
            <>
              <button
                onClick={onInstall}
                className="w-full py-3 rounded-xl text-white font-medium text-sm active:scale-[0.98] transition-transform"
                style={{ backgroundColor: primaryColor }}
              >
                Instalar app
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-gray-500 font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Ahora no
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-white font-medium text-sm active:scale-[0.98] transition-transform"
              style={{ backgroundColor: primaryColor }}
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
