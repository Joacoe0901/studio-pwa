"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAccessToken } from "@/lib/api";

interface Voucher {
    id: number;
    voucherName: string;
    serviceName: string;
    planType: string;
    totalSessions: number;
    consumed: number;
    cancelled?: number;
    upcoming: number;
    recoveriesUsed?: number;
    recoveriesMax?: number;
    expirationDate: string;
    status: string;
    periodYear: number;
    periodMonth: number;
}

const MONTHS = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// ─── Color tokens (consistentes con la barra de progreso) ─────────────────────
const STATE_COLORS = {
    consumed: "#3b82f6",    // blue-500
    upcoming: "#34d399",    // emerald-400
    cancelled: "#fb7185",   // rose-400
    available: "#e2e8f0",   // slate-200 → Disponibles (track)
    recoverable: "#fbbf24", // amber-400
};

interface StatRow {
    label: string;
    value: string;
    color: string;
    bordered?: boolean;
}

function DonutChart({ consumed, upcoming, cancelled, available, total, totalScheduled }: { consumed: number; upcoming: number; cancelled: number; available: number; total: number; totalScheduled: number }) {
    const overbooked = totalScheduled > total;
    const extra = Math.max(0, totalScheduled - total);
    const barScale = Math.max(total, totalScheduled);
    const size = 140;
    const stroke = 16;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;

    const segments = [
        { value: consumed, color: STATE_COLORS.consumed },
        { value: upcoming, color: STATE_COLORS.upcoming },
        { value: cancelled, color: STATE_COLORS.cancelled },
        { value: available, color: STATE_COLORS.available },
    ].filter((s) => s.value > 0);

    let acc = 0;
    const arcs = segments.map((s) => {
        const dash = barScale > 0 ? (s.value / barScale) * c : 0;
        const arc = { ...s, dash, offset: -acc };
        acc += dash;
        return arc;
    });

    return (
        <div className="relative mx-auto" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
                {arcs.map((a, i) => (
                    <circle
                        key={i}
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke={a.color}
                        strokeWidth={stroke}
                        strokeDasharray={`${a.dash} ${c - a.dash}`}
                        strokeDashoffset={a.offset}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className={`text-2xl font-bold tabular-nums leading-none ${overbooked ? "text-red-600" : "text-gray-900"}`}>
                    {totalScheduled}/{total}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Clases Totales</div>
                {overbooked && (
                    <span className="mt-1 text-xs font-semibold text-white bg-red-500 rounded-full px-2 py-0.5">
                        +{extra} extra
                    </span>
                )}
            </div>
        </div>
    );
}

function VoucherStats({ consumed, cancelled, upcoming, total, planType, recoveriesUsed, recoveriesMax }: { consumed: number; cancelled: number; upcoming: number; total: number; planType: string; recoveriesUsed: number; recoveriesMax: number }) {
    const totalScheduled = consumed + upcoming + cancelled;
    const available = Math.max(0, total - totalScheduled);
    const isMonthly = planType === "MONTHLY";
    const recoverable = Math.max(0, recoveriesMax - recoveriesUsed);

    const rows: StatRow[] = [
        { label: "Consumidas", value: `${consumed} / ${total}`, color: STATE_COLORS.consumed },
        { label: "Agendadas", value: `${upcoming} / ${total}`, color: STATE_COLORS.upcoming },
        { label: "Canceladas", value: `${cancelled} / ${total}`, color: STATE_COLORS.cancelled },
        { label: "Disponibles", value: `${available} / ${total}`, color: STATE_COLORS.available, bordered: true },
    ];
    const recoverables = isMonthly
        ? { label: "Recuperables", value: recoveriesMax > 0 ? `${recoverable} / ${recoveriesMax}` : "∞", color: STATE_COLORS.recoverable }
        : null;

    return (
        <div className="pt-4">
            <DonutChart
                consumed={consumed}
                upcoming={upcoming}
                cancelled={cancelled}
                available={available}
                total={total}
                totalScheduled={totalScheduled}
            />

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span
                            className={`w-2 h-2 rounded-full shrink-0 ${row.bordered ? "ring-1 ring-slate-300" : ""}`}
                            style={{ backgroundColor: row.color }}
                        />
                        <span>{row.label}:</span>
                        <span className="font-semibold tabular-nums text-gray-800">{row.value}</span>
                    </div>
                ))}
            </div>

            {recoverables && (
                <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: recoverables.color }} />
                    <span>{recoverables.label}:</span>
                    <span className="font-semibold tabular-nums text-gray-800">{recoverables.value}</span>
                </div>
            )}
        </div>
    );
}

export default function BonosPage() {
    const router = useRouter();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [primaryColor, setPrimaryColor] = useState("#53593D");
    const [filter, setFilter] = useState<"ACTIVE" | "ALL">("ACTIVE");
    const [openStats, setOpenStats] = useState<Record<number, boolean>>({});

    // Filter + order. "ACTIVE" shows only active vouchers; "ALL" shows everything
    // with active ones first and the rest sorted descending by period (year → month).
    const visibleVouchers = useMemo(() => {
        if (filter === "ACTIVE") {
            return vouchers.filter((v) => v.status === "ACTIVE");
        }
        const byPeriodDesc = (a: Voucher, b: Voucher) => {
            if (a.periodYear !== b.periodYear) return b.periodYear - a.periodYear;
            return b.periodMonth - a.periodMonth;
        };
        const active = vouchers.filter((v) => v.status === "ACTIVE").sort(byPeriodDesc);
        const inactive = vouchers.filter((v) => v.status !== "ACTIVE").sort(byPeriodDesc);
        return [...active, ...inactive];
    }, [vouchers, filter]);

    useEffect(() => {
        apiFetch<{ primaryColor: string }>("/client/company")
            .then((d) => setPrimaryColor(d.primaryColor || "#53593D"))
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
            case "INACTIVE": return "text-amber-600 bg-amber-50 border-amber-200";
            case "FINISHED": return "text-blue-600 bg-blue-50 border-blue-200";
            case "EXPIRED": return "text-red-500 bg-red-50 border-red-200";
            default: return "text-gray-500 bg-gray-50 border-gray-200";
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case "ACTIVE": return "Activo";
            case "INACTIVE": return "Inactivo";
            case "FINISHED": return "Completado";
            case "EXPIRED": return "Vencido";
            default: return status;
        }
    };

    return (
        <div className="h-dvh bg-white flex flex-col overflow-hidden">
            <header className="flex-shrink-0 px-4 pt-safe-top pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Mis Bonos</h1>
            </header>
            <main className="flex-1 min-h-0 px-6 pt-4 pb-10 space-y-4 overflow-y-auto">
                {/* Filtro Todos / Activos */}
                <div className="flex gap-2">
                    {([
                        { value: "ACTIVE", label: "Activos" },
                        { value: "ALL", label: "Todos" },
                    ] as const).map((option) => {
                        const isActive = filter === option.value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                                    isActive
                                        ? "text-white border-transparent"
                                        : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50"
                                }`}
                                style={isActive ? { backgroundColor: primaryColor } : undefined}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <p className="text-gray-400 text-sm">Cargando bonos...</p>
                ) : visibleVouchers.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                        {filter === "ACTIVE" ? "No tienes bonos activos." : "No tienes bonos."}
                    </p>
                ) : (
                    visibleVouchers.map((v) => {
                        const open = !!openStats[v.id];
                        return (
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

                                <p className="text-xs text-gray-400 mt-2">
                                    Vence {new Date(v.expirationDate).toLocaleDateString("es-ES", { timeZone: "UTC" })}
                                </p>

                                <button
                                    onClick={() => setOpenStats((s) => ({ ...s, [v.id]: !s[v.id] }))}
                                    className="mt-3 ml-auto flex w-fit items-center gap-1 text-sm font-semibold text-gray-700"
                                    aria-expanded={open}
                                >
                                    <span>ver más</span>
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                                    <div className="overflow-hidden">
                                        <VoucherStats
                                            consumed={v.consumed}
                                            cancelled={v.cancelled ?? 0}
                                            upcoming={v.upcoming}
                                            total={v.totalSessions}
                                            planType={v.planType}
                                            recoveriesUsed={v.recoveriesUsed ?? 0}
                                            recoveriesMax={v.recoveriesMax ?? 0}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </main>
        </div>
    );
}