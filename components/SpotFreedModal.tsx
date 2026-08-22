"use client";

import { useState } from "react";

interface SessionInfo {
  id: number;
  serviceName: string;
  instructor: string;
  startDateTime: string;
  endDateTime: string;
}

interface SpotFreedModalProps {
  session: SessionInfo;
  onBook: () => Promise<string | null>;
  onDismiss: () => void;
  primaryColor: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Madrid",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

export default function SpotFreedModal({
  session,
  onBook,
  onDismiss,
  primaryColor,
}: SpotFreedModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const errMsg = await onBook();
      if (errMsg) {
        setError(errMsg);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Error inesperado al reservar. Intentalo de nuevo.");
    }
    setLoading(false);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={success ? onDismiss : onDismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm max-h-[85dvh] bg-white rounded-2xl shadow-2xl animate-scale-in overflow-y-auto overflow-x-hidden">
        {success ? (
          <>
            <div className="flex flex-col items-center px-5 pt-6 pb-2 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">¡Reserva confirmada!</h2>
            </div>
            <div className="px-5 pt-2 pb-2 text-center">
              <p className="text-sm text-gray-600">
                Has reservado <strong>{session.serviceName}</strong>
                <br />
                {formatDate(session.startDateTime)} · {formatTime(session.startDateTime)} - {formatTime(session.endDateTime)}
              </p>
            </div>
            <div className="mx-5 border-t border-gray-100" />
            <div className="px-5 py-4">
              <button
                onClick={onDismiss}
                className="w-full py-2.5 rounded-xl text-white font-medium text-sm active:scale-[0.98] transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                Entendido
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center px-5 pt-6 pb-2 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">¡Hueco libre!</h2>
            </div>

            <div className="px-5 pt-1 pb-1">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <p className="font-semibold text-gray-900">{session.serviceName}</p>
                {session.instructor && (
                  <p className="text-xs text-gray-500 mt-0.5">{session.instructor}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(session.startDateTime)}
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  {formatTime(session.startDateTime)} - {formatTime(session.endDateTime)}
                </p>
              </div>
            </div>

            {error && (
              <div className="px-5 pt-2 pb-1">
                <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                  <p className="text-xs text-red-700 leading-relaxed text-center">{error}</p>
                </div>
              </div>
            )}

            <div className="mx-5 mt-3 border-t border-gray-100" />

            <div className="flex gap-3 px-5 py-4">
              <button
                onClick={onDismiss}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                No me interesa
              </button>
              <button
                onClick={handleBook}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {loading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Entrar a la clase
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
