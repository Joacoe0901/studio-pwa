"use client";

interface ClassSession {
  id: number;
  serviceName: string;
  startDateTime: string;
  endDateTime: string;
}

interface ConfirmationModalProps {
  type: "reserve" | "cancel" | "error";
  session: ClassSession;
  onConfirm?: () => void;
  onClose: () => void;
  loading?: boolean;
  primaryColor: string;
  title?: string;
  message?: string;
  tone?: "danger" | "warning" | "info";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export default function ConfirmationModal({
  type,
  session,
  onConfirm,
  onClose,
  loading = false,
  primaryColor,
  title,
  message,
  tone = "danger",
}: ConfirmationModalProps) {
  const isReserve = type === "reserve";
  const isError = type === "error";
  const toneBox: Record<string, string> = {
    danger: "bg-red-50 border-red-100",
    warning: "bg-amber-50 border-amber-100",
    info: "bg-slate-50 border-slate-200",
  };
  const toneText: Record<string, string> = {
    danger: "text-red-700",
    warning: "text-amber-700",
    info: "text-slate-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Icon + Title */}
        <div className="flex flex-col items-center px-5 pt-6 pb-2 text-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
              isReserve ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {isReserve ? (
              <svg
                className="w-7 h-7 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            ) : (
              <svg
                className="w-7 h-7 text-red-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {isError
              ? title ?? "No hay clases disponibles"
              : isReserve
                ? "Confirmar Reserva"
                : "Cancelar Reserva"}
          </h2>
        </div>

        {/* Session details */}
        <div className="px-5 pb-2 text-center">
          <p className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            {session.serviceName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(session.startDateTime)}
          </p>
          <p className="text-xs text-gray-400">
            {formatTime(session.startDateTime)} -{" "}
            {formatTime(session.endDateTime)}
          </p>
        </div>

        {/* Message */}
        <div className="px-5 pt-2 pb-4">
          {isReserve ? (
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              ¿Estás seguro de que deseas reservar esta clase?
            </p>
          ) : isError ? (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-xs text-red-700 leading-relaxed text-center">
                {message ??
                  "No tienes clases disponibles en tu bono para reservar esta clase."}
              </p>
            </div>
          ) : (
            <div className={`rounded-xl border p-3 ${toneBox[tone]}`}>
              <p className={`text-xs leading-relaxed ${toneText[tone]}`}>
                {message ??
                  "¿Estás seguro de que deseas cancelar tu reserva? Esta acción no se puede deshacer y podrías perder tu plaza."}
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-gray-100" />

        {/* Buttons */}
        <div className="flex gap-3 px-5 py-4">
          {isError ? (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm active:scale-[0.98] transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              Entendido
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isReserve ? "Cancelar" : "Volver"}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ backgroundColor: isReserve ? primaryColor : "#EF4444" }}
              >
                {loading && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                {isReserve ? "Confirmar Reserva" : "Sí, Cancelar"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
