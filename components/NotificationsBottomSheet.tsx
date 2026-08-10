"use client";

import { useRef, useState, useCallback } from "react";

interface Notification {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type?: string;
  sessionId?: number;
}

interface NotificationsBottomSheetProps {
  open: boolean;
  notifications: Notification[];
  onClose: () => void;
  onSelectNotification: (notification: Notification) => void;
}

export default function NotificationsBottomSheet({
  open,
  notifications,
  onClose,
  onSelectNotification,
}: NotificationsBottomSheetProps) {
  const [dismissing, setDismissing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef(false);

  const handleClose = useCallback(() => {
    setDismissing(true);
    setTimeout(() => { setDismissing(false); onClose(); }, 250);
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!(e.target as HTMLElement).closest("[data-sheet-handle]")) return;
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = currentY.current - startY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = "";
      sheetRef.current.style.transition = "";
    }
    if (delta > 100) handleClose();
  }, [handleClose]);

  if (!open && !dismissing) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;


  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${dismissing ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
      />
      <div
        ref={sheetRef}
        className={`relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${dismissing ? "translate-y-full" : "translate-y-0"} ${open && !dismissing ? "animate-slide-up" : ""}`}
        style={{ maxHeight: "50dvh" }}
      >
        <div
          data-sheet-handle
          className="flex-shrink-0 pt-3 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-2 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Notificaciones</h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold transition-all duration-300">
                {unreadCount}
              </span>
            )}
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors" aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-shrink-0 mx-6 border-t border-gray-100" />
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-8">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              <p className="text-gray-400 text-sm">No tienes notificaciones.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onSelectNotification(n)}
                  className={`w-full text-left rounded-xl border p-4 transition-colors active:scale-[0.98] ${n.read ? "bg-gray-50 border-gray-100 hover:bg-gray-100" : "bg-blue-50/60 border-blue-100 hover:bg-blue-100/60"}`}
                >
                  <div className="flex items-start gap-3">
                    {!n.read && <span className="flex-shrink-0 mt-1.5 w-2.5 h-2.5 rounded-full bg-brand-500" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-gray-900 leading-snug ${n.read ? "font-normal" : "font-bold"}`}>{n.title}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.body}</p>
                      <p className="text-[11px] text-gray-300 mt-2">
                        {new Date(n.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
