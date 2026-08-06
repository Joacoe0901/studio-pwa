"use client";

interface ClassSession {
  id: number;
  serviceName: string;
  serviceId: number;
  instructor: string;
  startDateTime: string;
  endDateTime: string;
  maxCapacity: number;
  enrolledCount: number;
  waitlistCount: number;
  waitlisted: boolean;
  enrolled: boolean;
  enrollmentId: number | null;
  color: string;
}

interface ClassCardProps {
  session: ClassSession;
  isPast: boolean;
  isOutsideWindow: boolean;
  onReserve: (session: ClassSession) => void;
  onCancel: (session: ClassSession) => void;
  onWaitlist: (session: ClassSession) => void;
  loading: boolean;
  studioName: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Madrid",
  });
}

export default function ClassCard({
  session,
  isPast,
  isOutsideWindow,
  onReserve,
  onCancel,
  onWaitlist,
  loading,
  studioName,
}: ClassCardProps) {
  const isFull = session.enrolledCount >= session.maxCapacity && session.maxCapacity > 0;
  const hasWaitlist = session.waitlistCount > 0;
  const timeRange = `${formatTime(session.startDateTime)} - ${formatTime(session.endDateTime)}`;

  // Aforo badge color
  let capacityColor = "text-green-600";
  if (session.waitlisted) capacityColor = "text-amber-600";
  else if (hasWaitlist) capacityColor = "text-amber-600";
  else if (isFull) capacityColor = "text-red-500";

  // Contador: 5/5 (3) si hay waitlist
  const capacityLabel = hasWaitlist
    ? `${session.enrolledCount}/${session.maxCapacity} (${session.waitlistCount})`
    : `${session.enrolledCount}/${session.maxCapacity}`;

  // Botón
  let buttonLabel = "";
  let buttonClass = "";
  let buttonDisabled = false;
  let buttonAction: () => void;

  if (isPast) {
    buttonLabel = "";
    buttonDisabled = true;
    buttonAction = () => {};
  } else if (session.enrolled) {
    buttonLabel = "CANCELAR";
    buttonClass =
      "text-red-600 font-medium px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50 active:scale-[0.98] transition-all";
    buttonAction = () => onCancel(session);
    buttonDisabled = loading;
  } else if (session.waitlisted && isFull) {
    // Still full — keep waiting, allow leaving waitlist
    buttonLabel = "EN ESPERA ✕";
    buttonClass =
      "bg-amber-500 text-white font-medium px-5 py-2 rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all shadow-sm";
    buttonAction = () => onCancel(session); // cancel waitlist
    buttonDisabled = loading;
  } else if (session.waitlisted && !isFull) {
    // Spot freed up! Let the waitlisted customer book it.
    buttonLabel = "RESERVAR";
    buttonClass =
      "bg-brand-500 text-white font-medium px-5 py-2 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm";
    buttonAction = () => onReserve(session);
    buttonDisabled = loading;
  } else if (isFull) {
    if (isOutsideWindow) {
      buttonLabel = "EN LISTA";
      buttonClass =
        "text-gray-400 font-medium px-4 py-2 rounded-xl border border-gray-200 cursor-not-allowed text-xs";
      buttonDisabled = true;
      buttonAction = () => {};
    } else {
      buttonLabel = "EN LISTA";
      buttonClass =
        "bg-gray-800 text-white font-medium px-5 py-2 rounded-xl hover:bg-gray-900 active:scale-[0.98] transition-all shadow-sm";
      buttonAction = () => onWaitlist(session);
      buttonDisabled = loading;
    }
  } else if (isOutsideWindow) {
    buttonLabel = "RESERVAR";
    buttonClass =
      "text-gray-400 font-medium px-4 py-2 rounded-xl border border-gray-200 cursor-not-allowed text-xs";
    buttonDisabled = true;
    buttonAction = () => {};
  } else {
    buttonLabel = "RESERVAR";
    buttonClass =
      "bg-brand-500 text-white font-medium px-5 py-2 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm";
    buttonAction = () => onReserve(session);
    buttonDisabled = loading;
  }

  return (
    <div
      className={`rounded-xl border border-gray-100 p-4 transition-opacity duration-300 ${
        isPast ? "opacity-50" : "bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: time + info */}
        <div className="flex-1 min-w-0">
          {/* Time range */}
          <p className="text-base font-bold text-gray-900 leading-tight">
            {timeRange}
          </p>
          {/* Service name */}
          <p className="text-sm font-semibold text-gray-800 mt-0.5 uppercase tracking-wide">
            {session.serviceName}
          </p>
          {/* Instructor + studio */}
          <p className="text-xs text-gray-500 mt-0.5 leading-tight truncate">
            {session.instructor ? `con ${session.instructor}` : studioName}
            {session.instructor && studioName && (
              <span className="text-gray-300"> · {studioName}</span>
            )}
          </p>
        </div>

        {/* Right: capacity + button */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {/* Capacity badge */}
          <div className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <span className={`text-xs font-semibold ${capacityColor}`}>
              {capacityLabel}
            </span>
          </div>

          {/* Action button */}
          {buttonLabel && (
            <button
              onClick={buttonAction}
              disabled={buttonDisabled}
              className={buttonClass}
            >
              {loading && buttonLabel !== "COMPLETO" ? "..." : buttonLabel}
            </button>
          )}
        </div>
      </div>

      {/* Date subtitle for clarity */}
      <p className="text-[11px] text-gray-400 mt-2">
        {formatDateShort(session.startDateTime)}
      </p>
    </div>
  );
}
