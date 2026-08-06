"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAccessToken } from "@/lib/api";
import ConfirmationModal from "@/components/ConfirmationModal";

interface Reservation {
    enrollmentId: number;
    sessionId: number;
    serviceName: string;
    startDateTime: string;
    endDateTime: string;
    enrollmentType: string;
    attended: boolean | null;
    cancelledConsumed: boolean;
    createdAt: string;
}

function isPast(endDateTime: string): boolean {
    return new Date(endDateTime).getTime() < Date.now();
}

function currentAndNextMonthRange(): { from: string; to: string } {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    // Last day of next month — JS Date handles year rollover automatically (e.g. Dec → Jan)
    const nextMonth = new Date(yyyy, now.getMonth() + 2, 0);
    const nextYYYY = nextMonth.getFullYear();
    const nextMM = String(nextMonth.getMonth() + 1).padStart(2, "0");
    const nextLastDay = nextMonth.getDate();
    return {
        from: `${yyyy}-${mm}-01`,
        to: `${nextYYYY}-${nextMM}-${String(nextLastDay).padStart(2, "0")}`,
    };
}

function attendanceLabel(attended: boolean | null): string {
    if (attended === true) return "Asistió";
    if (attended === false) return "No asistió";
    return "Pasada";
}

function attendanceStyle(attended: boolean | null): string {
    if (attended === true) return "text-green-600 bg-green-50 border border-green-200";
    if (attended === false) return "text-red-500 bg-red-50 border border-red-200";
    return "text-gray-400 bg-gray-100 border border-gray-200";
}

function cancelTone(outcome: string): "danger" | "warning" | "info" {
    if (outcome === "RECOVER") return "info";
    if (outcome === "CONSUME_NO_RECOVERY") return "warning";
    return "danger"; // CONSUME_LATE
}

export default function MisClasesPage() {
    const router = useRouter();
    const [allReservations, setAllReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState<number | null>(null);
    const [primaryColor, setPrimaryColor] = useState("#53593D");
    const [confirmCancel, setConfirmCancel] = useState<Reservation | null>(null);
    const [cancelPreview, setCancelPreview] = useState<{ message: string; tone: "danger" | "warning" | "info" } | null>(null);

    useEffect(() => {
        apiFetch<{ primaryColor: string }>("/client/company")
            .then((d) => setPrimaryColor(d.primaryColor || "#53593D"))
            .catch(() => {});
    }, []);

    const load = async () => {
        try {
            const data = await apiFetch<Reservation[]>("/client/reservations");
            setAllReservations(data);
        } catch { /* handled by guard */ }
        setLoading(false);
    };

    useEffect(() => {
        if (!getAccessToken()) { router.replace("/login"); return; }
        load();
    }, [router]);

    /* Filter: current + next month, sorted nearest → farthest */
    const reservations = useMemo(() => {
        const { from, to } = currentAndNextMonthRange();
        return allReservations
            .filter((r) => r.startDateTime >= from && r.startDateTime <= to + "T23:59:59")
            .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    }, [allReservations]);

    const handleCancelClick = async (r: Reservation) => {
        setConfirmCancel(r);
        setCancelPreview(null);
        try {
            const p = await apiFetch<{ outcome: string; message: string }>(
                `/client/reservations/${r.enrollmentId}/cancel-preview`,
            );
            setCancelPreview({ message: p.message, tone: cancelTone(p.outcome) });
        } catch {
            /* keep default modal text if the preview fails */
        }
    };

    const handleConfirmCancel = async () => {
        if (!confirmCancel) return;
        setCancelling(confirmCancel.enrollmentId);
        try {
            await apiFetch(`/client/reservations/${confirmCancel.enrollmentId}`, { method: "DELETE" });
            setAllReservations((prev) => prev.filter((r) => r.enrollmentId !== confirmCancel.enrollmentId));
        } catch { /* toast later */ }
        setCancelling(null);
        setConfirmCancel(null);
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Madrid" });
    };
    const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

    return (
        <div className="h-dvh bg-white flex flex-col overflow-hidden">
            <header className="flex-shrink-0 px-4 pt-10 pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Mis Clases</h1>
            </header>
            <main className="flex-1 min-h-0 px-6 pt-4 pb-10 space-y-3 overflow-y-auto">
                {loading ? (
                    <p className="text-gray-400 text-sm">Cargando...</p>
                ) : reservations.length === 0 ? (
                    <p className="text-gray-400 text-sm">No tienes clases reservadas.</p>
                ) : (
                    reservations.map((r) => {
                        const past = isPast(r.endDateTime);
                        return (
                            <div
                                key={r.enrollmentId}
                                className={`rounded-xl border border-gray-100 p-4 bg-gray-50 transition-opacity ${past ? "opacity-50" : ""}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-900">{r.serviceName}</p>
                                        <p className="text-sm text-gray-500">{formatDate(r.startDateTime)} {formatTime(r.startDateTime)} - {formatTime(r.endDateTime)}</p>
                                        <p className="text-xs text-gray-400 mt-1 capitalize">{r.enrollmentType === "FIXED" ? "Fija" : "Ocasional"}</p>
                                    </div>
                                    {r.cancelledConsumed ? (
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-amber-600 bg-amber-50 border border-amber-200">
                                            Cancelada · consumida
                                        </span>
                                    ) : past ? (
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${attendanceStyle(r.attended)}`}>
                                            {attendanceLabel(r.attended)}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleCancelClick(r)}
                                            disabled={cancelling === r.enrollmentId}
                                            className="text-red-600 font-medium px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50 active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            {cancelling === r.enrollmentId ? "..." : "Cancelar"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </main>

            {confirmCancel && (
                <ConfirmationModal
                    type="cancel"
                    session={{
                        id: confirmCancel.sessionId,
                        serviceName: confirmCancel.serviceName,
                        startDateTime: confirmCancel.startDateTime,
                        endDateTime: confirmCancel.endDateTime,
                    }}
                    onConfirm={handleConfirmCancel}
                    onClose={() => { setConfirmCancel(null); setCancelPreview(null); }}
                    loading={cancelling === confirmCancel.enrollmentId}
                    primaryColor={primaryColor}
                    message={cancelPreview?.message}
                    tone={cancelPreview?.tone}
                />
            )}
        </div>
    );
}
