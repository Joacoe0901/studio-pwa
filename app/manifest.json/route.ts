import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Server-side route — uses env var directly (no proxy needed for manifest)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

// Maps an icon URL to its MIME type from the file extension. The uploaded icon
// keeps its original extension (jpg/jpeg/png/webp/svg), so we must NOT hardcode
// "image/png" — Chrome validates the declared type against the actual bytes and
// may ignore/reject an icon whose declared type does not match the file.
function iconTypeFromUrl(url: string): string {
    const clean = url.split("?")[0].split("#")[0].toLowerCase();
    if (clean.endsWith(".svg")) return "image/svg+xml";
    if (clean.endsWith(".webp")) return "image/webp";
    if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
    return "image/png";
}

// The built-in fallback icons are known to be 512×512. Custom uploads have
// arbitrary dimensions (e.g. a 765×767 logo), so claiming "512x512" for them
// would be wrong and could make Chrome skip the icon.
function iconSizesFromUrl(url: string): string {
    return url.startsWith("/icons/icon-512") || url === "/andes_logo_pwa.png"
        ? "512x512"
        : "any";
}

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
                    sizes: iconSizesFromUrl(appIconUrl),
                    type: iconTypeFromUrl(appIconUrl),
                    purpose: "any maskable",
                },
            ],
        };

        return NextResponse.json(manifest, {
            headers: { "Cache-Control": "no-store" },
        });
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
            },
            { headers: { "Cache-Control": "no-store" } }
        );
    }
}