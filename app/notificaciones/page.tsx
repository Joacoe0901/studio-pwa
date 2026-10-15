"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAccessToken } from "@/lib/api";
import AppHeader from "@/components/AppHeader";

interface Notification {
    id: number;
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
    type?: string;
    sessionId?: number;
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
            <AppHeader title="Notificaciones" primaryColor={primaryColor} />
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