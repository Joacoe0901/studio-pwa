import { NextResponse } from "next/server";

// Server-side route — uses env var directly (no proxy needed for manifest)
// Fallback icon served by Go backend at GET /api/v1/app-icon.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function GET() {
    try {
        const res = await fetch(`${API_URL}/settings`);
        const data = await res.json();

        const studioName = data.studioName || "Andes Pilates";
        const primaryColor = data.primaryColor || "#53593D";
        const appIconUrl = data.appIconUrl || "/icons/icon-512.png";

        const manifest = {
            name: studioName,
            short_name: studioName,
            description: data.description || "Tu espacio de bienestar",
            start_url: "/",
            display: "standalone",
            background_color: "#FFFFFF",
            theme_color: primaryColor,
            orientation: "portrait",
            icons: [
                {
                    src: appIconUrl,
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "any maskable",
                },
            ],
        };

        return NextResponse.json(manifest);
    } catch {
        return NextResponse.json(
            {
                name: "Andes Pilates",
                short_name: "Andes Pilates",
                start_url: "/",
                display: "standalone",
                background_color: "#FFFFFF",
                theme_color: "#53593D",
                orientation: "portrait",
                icons: [
                    { src: "/andes_logo_pwa.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
                ],
            }
        );
    }
}