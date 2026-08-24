"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  loginWithCode,
  requestCodeByEmail,
  checkCustomerEmail,
  getAccessToken,
  getPublicLegalContent,
  recordAcceptance,
} from "@/lib/api";
import InstallBanner from "@/components/InstallBanner";
import InstallPromptModal from "@/components/InstallPromptModal";
import { getInstallPromptVariant, markInstallPromptSeen, type InstallPromptVariant } from "@/lib/onboarding";
import { getCachedBranding } from "@/lib/branding";

const CODE_LENGTH = 6;

type Step = "email" | "options" | "code";

export default function LoginPage() {
  const router = useRouter();

  // If already logged in, go straight to home.
  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/home");
    }
  }, [router]);

  /* ─── Install guide on first access (mobile only) ─────────────────────── */
  const [installPrompt, setInstallPrompt] = useState<InstallPromptVariant | null>(null);

  useEffect(() => {
    // Already-authenticated users are redirected to /home, which shows the
    // prompt instead — avoid a flash here.
    if (getAccessToken()) return;
    setInstallPrompt(getInstallPromptVariant());
  }, []);

  function handleCloseInstallPrompt() {
    markInstallPromptSeen();
    setInstallPrompt(null);
  }

  // ── Shared state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function goBack() {
    setError("");
    if (step === "options") {
      setStep("email");
    } else if (step === "code") {
      setStep("options");
      setCodeSent(false);
      setCode("");
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length <= CODE_LENGTH) {
      setCode(value);
      setError("");
    }
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canGoNext = isValidEmail && acceptedLegal;

  // ── Step 1: Email → Validate → Next ────────────────────────────────────────
  async function handleEmailNext(e: React.FormEvent) {
    e.preventDefault();
    if (!canGoNext) return;
    setError("");
    setLoading(true);

    try {
      const exists = await checkCustomerEmail(email);
      if (!exists) {
        setError("Correo no registrado. Contacta con el estudio para registrarte.");
        return;
      }
      setStep("options");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al verificar el email.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Request code by email ────────────────────────────────────────
  async function handleRequestCode() {
    setError("");
    setLoading(true);
    try {
      await requestCodeByEmail(email);
      setCodeSent(true);
      setStep("code");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Login with code ──────────────────────────────────────────────
  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setError("El código debe tener 6 caracteres.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await loginWithCode(code);

      // Record commercial communications consent if the user opted in at login.
      if (acceptedMarketing) {
        try {
          const pub = await getPublicLegalContent("MARKETING_COMMUNICATIONS");
          if (pub.versionId) {
            await recordAcceptance(pub.versionId, true);
          }
        } catch {
          // Do not block login if consent recording fails.
        }
      }

      router.push("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden">
      <InstallBanner />
      <div className="flex-1 min-h-0 overflow-y-auto pt-safe">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-8">
          {/* Logo */}
          <div className="mb-8 text-center w-full">
            <img
              src="/logo-sin-fondo.png"
              alt="Andes Pilates"
              className="w-[70%] max-w-[220px] h-auto mx-auto object-contain"
            />
          </div>

      {/* ─── STEP 1: Email + Terms ─────────────────────────────────────── */}
      {step === "email" && (
        <form onSubmit={handleEmailNext} className="w-full max-w-xs space-y-6">
          <p className="text-center text-gray-600 text-sm">
            Ingresa tu correo electrónico para continuar
          </p>

          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="tu@email.com"
            className="block w-full text-center text-lg py-4 px-4
              border-2 rounded-xl outline-none
              border-gray-300 focus:border-brand-500
              transition-colors duration-150"
            aria-label="Correo electrónico"
          />

          {/* Legal checkbox (mandatory: Terms + Privacy) */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(e) => {
                setAcceptedLegal(e.target.checked);
                setError("");
              }}
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 flex-shrink-0"
            />
            <span className="text-sm text-gray-600 leading-snug">
              He leído y acepto los{" "}
              <Link
                href="/terminos"
                className="text-brand-600 underline hover:text-brand-700"
              >
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link
                href="/privacidad"
                className="text-brand-600 underline hover:text-brand-700"
              >
                Política de Privacidad
              </Link>
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedMarketing}
              onChange={(e) => {
                setAcceptedMarketing(e.target.checked);
                setError("");
              }}
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 flex-shrink-0"
            />
            <span className="text-sm text-gray-600 leading-snug">
              Acepto recibir{" "}
              <Link
                href="/comunicaciones"
                className="text-brand-600 underline hover:text-brand-700"
              >
                Comunicaciones Comerciales
              </Link>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canGoNext || loading}
            className="w-full py-4 rounded-xl text-white font-semibold text-lg
              bg-brand-500 hover:bg-brand-600 active:bg-brand-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors duration-150"
          >
            {loading ? "Verificando..." : "Siguiente"}
          </button>
        </form>
      )}

      {/* ─── STEP 2: Options (send code / I know my code) ────────────────── */}
      {step === "options" && (
        <div className="w-full max-w-xs space-y-6">
          <p className="text-center text-gray-600 text-sm">
            ¿Cómo quieres continuar?
          </p>

          {error && (
            <p role="alert" className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          <button
            onClick={handleRequestCode}
            disabled={loading}
            className="w-full py-4 rounded-xl border-2 border-brand-500 text-brand-600
              font-semibold text-base hover:bg-brand-50 active:bg-brand-100
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors duration-150"
          >
            {loading ? "Solicitando..." : "Enviar código a mi correo"}
          </button>

          <button
            onClick={() => {
              setError("");
              setStep("code");
            }}
            className="w-full py-4 rounded-xl border-2 border-gray-300 text-gray-700
              font-semibold text-base hover:bg-gray-50 active:bg-gray-100
              transition-colors duration-150"
          >
            Ya conozco mi código
          </button>

          <button
            onClick={goBack}
            className="w-full py-3 text-sm text-gray-400 hover:text-gray-600
              transition-colors duration-150"
          >
            ← Volver
          </button>
        </div>
      )}

      {/* ─── STEP 3: Code entry ─────────────────────────────────────────── */}
      {step === "code" && (
        <form onSubmit={handleCodeSubmit} className="w-full max-w-xs space-y-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              {codeSent
                ? "Te hemos enviado el código a tu correo"
                : "Ingresa tu código de acceso"}
            </p>
            {codeSent && (
              <p className="text-xs text-gray-400 mt-1 break-all">{email}</p>
            )}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={CODE_LENGTH}
              value={code}
              onChange={handleCodeChange}
              disabled={loading}
              placeholder="AB3X7K"
              className="block w-full text-center text-3xl font-mono font-bold tracking-[0.5em] uppercase
                border-2 rounded-xl py-4 px-4 outline-none
                border-gray-300 focus:border-brand-500
                disabled:opacity-50
                transition-colors duration-150"
              aria-label="Código de acceso de 6 caracteres"
            />
            <p className="text-right text-xs text-gray-400">
              {code.length}/{CODE_LENGTH}
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-600 text-center">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={code.length !== CODE_LENGTH || loading}
            className="w-full py-4 rounded-xl text-white font-semibold text-lg
              bg-brand-500 hover:bg-brand-600 active:bg-brand-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors duration-150"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>

          <button
            type="button"
            onClick={goBack}
            className="w-full py-3 text-sm text-gray-400 hover:text-gray-600
              transition-colors duration-150"
          >
            ← Volver
          </button>
        </form>
      )}
        </div>
      </div>

      {/* ─── Install guide modal (first access, mobile) ─────────────────── */}
      {installPrompt && (
        <InstallPromptModal
          variant={installPrompt}
          onClose={handleCloseInstallPrompt}
          primaryColor={getCachedBranding().primaryColor}
        />
      )}
    </div>
  );
}
