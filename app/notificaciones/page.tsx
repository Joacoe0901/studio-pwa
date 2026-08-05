"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAccessToken } from "@/lib/api";

interface Notification {
    id: number;
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
}

export default function NotificacionesPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [primaryColor, setPrimaryColor] = useState("#53593D");

    useEffect(() => {
        apiFetch<{ primaryColor: string }>("/client/company")
            .then((d) => setPrimaryColor(d.primaryColor || "#53593D"))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!getAccessToken()) { router.replace("/login"); return; }
        apiFetch<Notification[]>("/client/notifications")
            .then((data) => {
                setNotifications(data);
                // Mark everything as read so the home badge clears on next load.
                if (data.some((n) => !n.read)) {
                    apiFetch("/client/notifications/read-all", { method: "POST" }).catch(() => { });
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [router]);

    return (
        <div className="h-dvh bg-white flex flex-col overflow-hidden">
            <header className="flex-shrink-0 px-4 pt-10 pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Notificaciones</h1>
            </header>
            <main className="flex-1 min-h-0 px-6 pb-10 space-y-3 overflow-y-auto">
                {loading ? (
                    <p className="text-gray-400 text-sm">Cargando...</p>
                ) : notifications.length === 0 ? (
                    <p className="text-gray-400 text-sm">No tienes notificaciones.</p>
                ) : (
                    notifications.map((n) => (
                        <div key={n.id} className={`rounded-xl border p-4 ${n.read ? "bg-gray-50 border-gray-100" : "bg-blue-50 border-blue-100"}`}>
                            <p className="font-semibold text-gray-900">{n.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleDateString("es-ES", { timeZone: "UTC" })}</p>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}