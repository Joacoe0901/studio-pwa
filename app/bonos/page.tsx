"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAccessToken } from "@/lib/api";

interface Voucher {
    id: number;
    voucherName: string;
    serviceName: string;
    planType: string;
    totalSessions: number;
    consumed: number;
    upcoming: number;
    excess?: number;
    recoveriesUsed?: number;
    recoveriesMax?: number;
    expirationDate: string;
    status: string;
    periodMonth: number;
}

const MONTHS = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function VoucherProgress({ consumed, upcoming, total, excess, planType, recoveriesUsed, recoveriesMax }: { consumed: number; upcoming: number; total: number; excess: number; planType: string; recoveriesUsed: number; recoveriesMax: number }) {
    // When there's excess (N > total), the bar denominator grows to N so the extra
    // classes get their own amber segment at the end; otherwise it stays at `total`.
    const denom = total + excess;
    const consumedWithinCap = Math.min(consumed, total);
    const upcomingWithinCap = Math.max(0, Math.min(upcoming, total - consumedWithinCap));
    const consumedPct = denom > 0 ? (consumedWithinCap / denom) * 100 : 0;
    const upcomingPct = denom > 0 ? (upcomingWithinCap / denom) * 100 : 0;
    const excessPct = denom > 0 ? (excess / denom) * 100 : 0;
    const available = Math.max(0, total - consumed - upcoming);
    const isMonthly = planType === "MONTHLY";
    const recoverable = Math.max(0, recoveriesMax - recoveriesUsed);
    const showLabels = consumed > 0 || upcoming > 0;
    return (
        <div className="mt-3 space-y-2">
            {/* Descriptive text */}
            <div className="text-slate-800 text-sm font-medium">
                Consumidas: <span className="font-semibold tabular-nums">{consumed}/{total}</span>{" · "}
                Agendadas: <span className="font-semibold tabular-nums">{consumed + upcoming}/{total}</span>{" · "}
                {isMonthly ? (
                    <>Clases recuperables: <span className="font-semibold tabular-nums">{recoveriesMax > 0 ? recoverable : "∞"}</span></>
                ) : (
                    <>Disponibles: <span className="font-semibold tabular-nums">{available}/{total}</span></>
                )}
                {excess > 0 && (
                    <span className="text-amber-600 font-semibold"> · +{excess} de más</span>
                )}
            </div>

            {/* Bar with its status labels */}
            <div className="w-full">
                {/* Top labels — no excess: anchored at the extremes (Asistida left, Próximas right) */}
                {showLabels && excess === 0 && (
                    <div className="flex justify-between text-xs font-semibold mb-1 px-0.5">
                        {consumed > 0 ? (
                            <span className="text-blue-600 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                {consumed} Asistida{consumed !== 1 ? "s" : ""}
                            </span>
                        ) : (
                            <span />
                        )}
                        {upcoming > 0 && (
                            <span className="text-emerald-600 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {upcoming} Próxima{upcoming !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                )}
                {/* Top labels — with excess: each label sits over its own bar segment */}
                {excess > 0 && (
                    <div className="relative h-4 mb-1 text-xs font-semibold">
                        {consumed > 0 && (
                            <span className="absolute left-0 top-0 text-blue-600 flex items-center gap-1 whitespace-nowrap">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                {consumed} Asistida{consumed !== 1 ? "s" : ""}
                            </span>
                        )}
                        {upcoming > 0 && (
                            <span
                                className="absolute top-0 -translate-x-1/2 text-emerald-600 flex items-center gap-1 whitespace-nowrap"
                                style={{ left: `${consumedPct + upcomingPct / 2}%` }}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {upcoming} Próxima{upcoming !== 1 ? "s" : ""}
                            </span>
                        )}
                        <span className="absolute right-0 top-0 text-amber-600 flex items-center gap-1 whitespace-nowrap">
                            +{excess} de más
                        </span>
                    </div>
                )}

                {/* Segmented single-line progress bar (gray track = disponibles) */}
                <div className="h-3 w-full bg-slate-200 rounded-full flex overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${consumedPct}%` }}
                    />
                    <div
                        className="h-full bg-emerald-400 transition-all duration-300"
                        style={{ width: `${upcomingPct}%` }}
                    />
                    {excess > 0 && (
                        <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${excessPct}%` }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BonosPage() {
    const router = useRouter();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [primaryColor, setPrimaryColor] = useState("#4A7C59");

    useEffect(() => {
        apiFetch<{ primaryColor: string }>("/client/company")
            .then((d) => setPrimaryColor(d.primaryColor || "#4A7C59"))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!getAccessToken()) { router.replace("/login"); return; }
        apiFetch<Voucher[]>("/client/vouchers")
            .then(setVouchers)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [router]);

    const statusColor = (status: string) => {
        switch (status) {
            case "ACTIVE": return "text-green-600 bg-green-50 border-green-200";
            case "FINISHED": return "text-gray-500 bg-gray-50 border-gray-200";
            case "EXPIRED": return "text-red-500 bg-red-50 border-red-200";
            default: return "text-gray-500 bg-gray-50 border-gray-200";
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case "ACTIVE": return "Activo";
            case "FINISHED": return "Finalizado";
            case "EXPIRED": return "Expirado";
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="flex-shrink-0 px-4 pt-10 pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Mis Bonos</h1>
            </header>
            <main className="flex-1 min-h-0 px-6 pt-4 pb-10 space-y-4 overflow-y-auto">
                {loading ? (
                    <p className="text-gray-400 text-sm">Cargando bonos...</p>
                ) : vouchers.length === 0 ? (
                    <p className="text-gray-400 text-sm">No tienes bonos activos.</p>
                ) : (
                    vouchers.map((v) => (
                        <div key={v.id} className="rounded-xl border border-gray-100 p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-gray-900">{v.voucherName || v.serviceName}</p>
                                    <p className="text-sm text-gray-500">{v.serviceName} - <span className="font-bold text-gray-700">{MONTHS[v.periodMonth] || ""}</span></p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusColor(v.status)}`}>
                                    {statusLabel(v.status)}
                                </span>
                            </div>
                            <VoucherProgress
                                consumed={v.consumed}
                                upcoming={v.upcoming}
                                total={v.totalSessions}
                                excess={v.excess ?? 0}
                                planType={v.planType}
                                recoveriesUsed={v.recoveriesUsed ?? 0}
                                recoveriesMax={v.recoveriesMax ?? 0}
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Vence {new Date(v.expirationDate).toLocaleDateString("es-ES", { timeZone: "UTC" })}
                            </p>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}