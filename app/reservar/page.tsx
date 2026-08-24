"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAccessToken } from "@/lib/api";
import { setCachedBranding } from "@/lib/branding";
import CalendarSlider, {
  generateCalendarDays,
  todayStr,
  type CalendarDay,
} from "@/components/CalendarSlider";
import ClassCard from "@/components/ClassCard";
import ConfirmationModal from "@/components/ConfirmationModal";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface ClientBookableSession {
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

interface StudioBranding {
  studioName: string;
  primaryColor: string;
  calendarDays: string;
}

interface HolidayResponse {
  id: number;
  date: string;
  name: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function isPast(endDateTime: string): boolean {
  return new Date(endDateTime).getTime() < Date.now();
}

function isOutsideBookingWindow(startDateTime: string): boolean {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  maxDate.setHours(23, 59, 59, 999);
  return new Date(startDateTime).getTime() > maxDate.getTime();
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function cancelTone(outcome: string): "danger" | "warning" | "info" {
  if (outcome === "RECOVER") return "info";
  if (outcome === "CONSUME_NO_RECOVERY") return "warning";
  return "danger"; // CONSUME_LATE
}

/* ─── Component ─────────────────────────────────────────────────────────────── */

export default function ReservarPage() {
  const router = useRouter();

  const [primaryColor, setPrimaryColor] = useState("#53593D");
  const [sessions, setSessions] = useState<ClientBookableSession[]>([]);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [joiningWaitlist, setJoiningWaitlist] = useState<number | null>(null);
  const [confirmReserve, setConfirmReserve] = useState<ClientBookableSession | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<ClientBookableSession | null>(null);
  const [confirmWaitlist, setConfirmWaitlist] = useState<ClientBookableSession | null>(null);
  const [cancelPreview, setCancelPreview] = useState<{ message: string; tone: "danger" | "warning" | "info" } | null>(null);
  const [errorModal, setErrorModal] = useState<{ session: ClientBookableSession; message: string; title?: string } | null>(null);
  const [successModal, setSuccessModal] = useState<{ session: ClientBookableSession; message: string; title?: string } | null>(null);
  const [customerActive, setCustomerActive] = useState(true);
  const [holidays, setHolidays] = useState<Record<string, string>>({});

  /* Auth guard */
  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
    }
  }, [router]);

  /* Load customer active status */
  useEffect(() => {
    if (!getAccessToken()) return;
    apiFetch<{ active: boolean }>("/client/me")
      .then((data) => setCustomerActive(data.active))
      .catch(() => {});
  }, []);

  /* Load primary color */
  useEffect(() => {
    apiFetch<{ primaryColor: string }>("/client/company")
      .then((d) => setPrimaryColor(d.primaryColor || "#53593D"))
      .catch(() => {});
  }, []);

  /* Load branding */
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const data = await apiFetch<StudioBranding & { secondaryColor?: string; backgroundImageUrl?: string; logoUrl?: string }>("/client/company");
        setDays(generateCalendarDays(data.calendarDays));
        setCachedBranding(data);
      } catch {
        setDays(generateCalendarDays("MON_FRI"));
      }
    };
    loadBranding();
  }, []);

  /* Load sessions — from the Monday of the current week so past days are included */
  const loadSessions = useCallback(async () => {
    try {
      // Compute Monday of this week as the earliest visible day in the slider
      const now = new Date();
      const dow = now.getDay(); // 0=Sun
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      const from = monday.toISOString().slice(0, 10);
      const to = addDays(from, 14);
      const data = await apiFetch<ClientBookableSession[]>(`/client/sessions?from=${from}&to=${to}`);
      setSessions(data);
      // Also load holidays for the same date range.
      try {
        const holidayData = await apiFetch<HolidayResponse[]>(`/client/holidays?from=${from}&to=${to}`);
        const map: Record<string, string> = {};
        holidayData.forEach((h) => { map[h.date] = h.name; });
        setHolidays(map);
      } catch { /* holidays are optional */ }
    } catch { /* handled by guard */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!getAccessToken()) return;
    loadSessions();
  }, [loadSessions]);

  /* Filter sessions by date */
  const filteredSessions = sessions.filter((s) => s.startDateTime.startsWith(selectedDate));

  /* Reserve */
  const handleReserveClick = (session: ClientBookableSession) => {
    setConfirmReserve(session);
  };

  /* Waitlist */
  const handleWaitlistClick = (session: ClientBookableSession) => {
    setConfirmWaitlist(session);
  };

  const handleConfirmWaitlist = async () => {
    if (!confirmWaitlist) return;
    const session = confirmWaitlist;
    setJoiningWaitlist(session.id);
    try {
      await apiFetch("/client/waitlist", { method: "POST", body: JSON.stringify({ sessionId: session.id }) });
      setConfirmWaitlist(null);
      setSuccessModal({ session, title: "Lista de espera", message: "Entraste en la lista de espera. Te avisaremos si se libera un lugar." });
      await loadSessions();
    } catch (err: unknown) {
      setConfirmWaitlist(null);
      setErrorModal({ session, title: "Lista de espera", message: err instanceof Error ? err.message : "Error al entrar en lista de espera" });
    }
    setJoiningWaitlist(null);
  };

  const handleConfirmReserve = async () => {
    if (!confirmReserve) return;
    const session = confirmReserve;
    setReserving(session.id);
    try {
      await apiFetch("/client/reservations", { method: "POST", body: JSON.stringify({ sessionId: session.id }) });
      setConfirmReserve(null);
      setSuccessModal({ session, message: "¡Reserva realizada con éxito!" });
      await loadSessions();
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : "";
      setConfirmReserve(null);
      if (code === "VOUCHER_LIMIT_REACHED") {
        setErrorModal({
          session,
          message: "No tienes clases disponibles en tu bono para reservar esta clase.",
        });
      } else if (code === "NO_ACTIVE_PLAN") {
        setErrorModal({
          session,
          message: "No puede reservar esta clase, no tiene un bono activo.",
        });
      } else {
        setErrorModal({
          session,
          message: code || "Error al reservar",
        });
      }
    }
    setReserving(null);
  };

  /* Cancel / Leave waitlist */
  const handleCancelClick = async (session: ClientBookableSession) => {
    // If waitlisted, leave waitlist directly
    if (session.waitlisted) {
      setCancelling(session.id);
      try {
        await apiFetch(`/client/waitlist/${session.id}`, { method: "DELETE" });
        setSuccessModal({ session, title: "Lista de espera", message: "Saliste de la lista de espera." });
        await loadSessions();
      } catch (err: unknown) {
        setErrorModal({ session, title: "Lista de espera", message: err instanceof Error ? err.message : "Error al salir de la lista de espera" });
      }
      setCancelling(null);
      return;
    }
    // Otherwise, normal enrollment cancel flow
    setConfirmCancel(session);
    setCancelPreview(null);
    if (!session.enrollmentId) return;
    try {
      const p = await apiFetch<{ outcome: string; message: string }>(
        `/client/reservations/${session.enrollmentId}/cancel-preview`,
      );
      setCancelPreview({ message: p.message, tone: cancelTone(p.outcome) });
    } catch {
      /* keep default modal text if the preview fails */
    }
  };

  const handleConfirmCancel = async () => {
    if (!confirmCancel || !confirmCancel.enrollmentId) return;
    setCancelling(confirmCancel.id);
    try {
      await apiFetch(`/client/reservations/${confirmCancel.enrollmentId}`, { method: "DELETE" });
      setConfirmCancel(null);
      setSuccessModal({ session: confirmCancel, title: "Reserva cancelada", message: "Reserva cancelada." });
      await loadSessions();
    } catch (err: unknown) {
      setConfirmCancel(null);
      setErrorModal({ session: confirmCancel, title: "Cancelar Reserva", message: err instanceof Error ? err.message : "Error al cancelar" });
    }
    setCancelling(null);
  };

  /* Derived */

  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-4 pt-safe-top pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
        <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-white">Reservas</h1>
      </header>
      <CalendarSlider days={days} selectedDate={selectedDate} onSelect={(date) => setSelectedDate(date)} primaryColor={primaryColor} />
      <main className="flex-1 px-4 pb-10 pt-3 space-y-2 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
            <p className="text-gray-400 text-sm">Cargando clases...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          holidays[selectedDate] ? (
            /* Holiday card — matches ClassCard aesthetics */
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-9h.008v.008H12v-.008ZM12 15h.008v.008H12V15Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800">Cerrado por {holidays[selectedDate]}</p>
                  <p className="text-xs text-amber-600 mt-0.5">No hay clases este día</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <p className="text-gray-400 text-sm">No hay clases disponibles para este dia.</p>
            </div>
          )
        ) : (
          filteredSessions.map((s) => (
            <ClassCard key={s.id} session={s} isPast={isPast(s.endDateTime)} isOutsideWindow={isOutsideBookingWindow(s.startDateTime)} isCustomerInactive={!customerActive} onReserve={handleReserveClick} onCancel={handleCancelClick} onWaitlist={handleWaitlistClick} loading={reserving === s.id || cancelling === s.id || joiningWaitlist === s.id} />
          ))
        )}
      </main>
      {confirmReserve && (
        <ConfirmationModal type="reserve" session={confirmReserve} onConfirm={handleConfirmReserve} onClose={() => setConfirmReserve(null)} loading={reserving === confirmReserve.id} primaryColor={primaryColor} />
      )}
      {confirmCancel && (
        <ConfirmationModal type="cancel" session={confirmCancel} message={cancelPreview?.message} tone={cancelPreview?.tone} onConfirm={handleConfirmCancel} onClose={() => { setConfirmCancel(null); setCancelPreview(null); }} loading={cancelling === confirmCancel.id} primaryColor={primaryColor} />
      )}
      {confirmWaitlist && (
        <ConfirmationModal type="waitlist" session={confirmWaitlist} onConfirm={handleConfirmWaitlist} onClose={() => setConfirmWaitlist(null)} loading={joiningWaitlist === confirmWaitlist.id} primaryColor={primaryColor} />
      )}
      {errorModal && (
        <ConfirmationModal
          type="error"
          session={errorModal.session}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal(null)}
          primaryColor={primaryColor}
        />
      )}
      {successModal && (
        <ConfirmationModal
          type="success"
          session={successModal.session}
          title={successModal.title}
          message={successModal.message}
          onClose={() => setSuccessModal(null)}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
}
