"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAccessToken, resolveUploadUrl, API_URL } from "@/lib/api";
import { DateInput } from "@/components/ui/date-input";

interface ClientMe {
    id: number;
    loginCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    dni: string;
    address: string;
    city: string;
    postalCode: string;
    province: string;
    country: string;
    birthDate: string;
    profileImage: string;
}

export default function PerfilPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<ClientMe | null>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [dni, setDni] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [province, setProvince] = useState("");
    const [country, setCountry] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [primaryColor, setPrimaryColor] = useState("#53593D");
    const [photoMenu, setPhotoMenu] = useState(false);
    const [viewPhoto, setViewPhoto] = useState(false);
    const [photoUrl, setPhotoUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        apiFetch<{ primaryColor: string }>("/client/company")
            .then((d) => setPrimaryColor(d.primaryColor || "#53593D"))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!getAccessToken()) { router.replace("/login"); return; }
        apiFetch<ClientMe>("/client/me")
            .then((data) => {
                setProfile(data);
                setFirstName(data.firstName ?? "");
                setLastName(data.lastName ?? "");
                setPhone(data.phone ?? "");
                setEmail(data.email ?? "");
                setDni(data.dni ?? "");
                setAddress(data.address ?? "");
                setCity(data.city ?? "");
                setPostalCode(data.postalCode ?? "");
                setProvince(data.province ?? "");
                setCountry(data.country ?? "");
                setBirthDate(data.birthDate ?? "");
                setPhotoUrl(data.profileImage ?? "");
            })
            .catch(() => { });
    }, [router]);

    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        try {
            await apiFetch("/client/me", {
                method: "PUT",
                body: JSON.stringify({
                    firstName, lastName, phone, email, dni,
                    birthDate, address, city, postalCode, province, country,
                }),
            });
            setMessage("Perfil actualizado.");
        } catch (err: unknown) {
            setMessage(err instanceof Error ? err.message : "Error al guardar");
        }
        setSaving(false);
    };

    const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch(`${API_URL}/client/me/profile-image`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getAccessToken()}` },
                body: form,
            });
            if (!res.ok) throw new Error("Error al subir foto");
            const data = await res.json();
            setPhotoUrl(data.profileImage);
            setPhotoMenu(false);
        } catch (err: unknown) {
            setMessage(err instanceof Error ? err.message : "Error al subir foto");
        }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getInitials = () => {
        if (!profile) return "?";
        return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
    };

    return (
        <div className="h-dvh bg-white flex flex-col overflow-hidden">
            <header className="flex-shrink-0 px-4 pt-safe-top pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Perfil</h1>
            </header>
            <main className="flex-1 min-h-0 px-6 pb-10 pt-4 overflow-y-auto overflow-x-hidden">
                {!profile ? (
                    <p className="text-gray-400 text-sm">Cargando...</p>
                ) : (
                    <div className="space-y-6">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={() => setPhotoMenu(!photoMenu)}
                                    className="block"
                                >
                                    {photoUrl ? (
                                        <img
                                            src={resolveUploadUrl(photoUrl)}
                                            alt="Avatar"
                                            className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-brand-500 text-white flex items-center justify-center text-2xl font-bold">
                                            {getInitials()}
                                        </div>
                                    )}
                                </button>
                                <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                                    </svg>
                                </div>

                                {photoMenu && (
                                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30 min-w-[160px]">
                                        {photoUrl && (
                                            <button
                                                onClick={() => { setViewPhoto(true); setPhotoMenu(false); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
                                                Ver foto
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { fileInputRef.current?.click(); setPhotoMenu(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                                            </svg>
                                            Cambiar foto
                                        </button>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleUploadPhoto}
                                className="hidden"
                            />
                        </div>

                        {uploading && (
                            <div className="flex items-center justify-center gap-2 text-sm text-brand-600">
                                <div className="w-4 h-4 border-2 border-t-transparent border-brand-500 rounded-full animate-spin" />
                                Subiendo foto...
                            </div>
                        )}

                        {/* Form */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Nombre/s</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Apellidos</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">DNI / NIE</label>
                                <input
                                    type="text"
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                                <DateInput
                                    value={birthDate}
                                    onChange={setBirthDate}
                                    placeholder="Seleccionar fecha"
                                    ariaLabel="Fecha de nacimiento"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Dirección</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Ciudad</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Código Postal</label>
                                    <input
                                        type="text"
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Provincia</label>
                                    <input
                                        type="text"
                                        value={province}
                                        onChange={(e) => setProvince(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">País</label>
                                    <input
                                        type="text"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {saving ? "Guardando..." : "Guardar Cambios"}
                            </button>
                            {message && (
                                <p className="text-sm text-center text-green-600">{message}</p>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* View Photo Modal */}
            {viewPhoto && photoUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                    onClick={() => setViewPhoto(false)}
                >
                    <div className="relative" style={{ width: "80%" }}>
                        <img
                            src={resolveUploadUrl(photoUrl)}
                            alt="Foto de perfil"
                            className="w-full rounded-2xl object-contain max-h-[80vh]"
                        />
                        <button
                            onClick={() => setViewPhoto(false)}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
