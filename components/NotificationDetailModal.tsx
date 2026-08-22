"use client";

interface Notification {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type?: string;
  sessionId?: number;
}

interface NotificationDetailModalProps {
  notification: Notification;
  onClose: () => void;
}

export default function NotificationDetailModal({
  notification,
  onClose,
}: NotificationDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm max-h-[85dvh] bg-white rounded-2xl shadow-2xl animate-scale-in overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="flex-1 min-w-0 text-lg font-bold text-gray-900 pr-2 leading-snug">
            {notification.title}
          </h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            aria-label="Cerrar"
          >
            <svg
              className="w-5 h-5"
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

        {/* Date */}
        <p className="px-5 pb-2 text-xs text-gray-400">
          {new Date(notification.createdAt).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
          })}
        </p>

        {/* Divider */}
        <div className="mx-5 border-t border-gray-100" />

        {/* Body */}
        <div className="px-5 py-4 pb-6">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {notification.body}
          </p>
        </div>

        {/* Footer button */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-medium text-sm active:scale-[0.98] transition-transform hover:bg-brand-600"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
