const BRANDING_KEY = "studioBranding";

export interface CachedBranding {
  studioName: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundImageUrl: string;
  logoUrl: string;
}

function getDefaultBranding(): CachedBranding {
  return {
    studioName: "Andes Pilates",
    primaryColor: "#53593D",
    secondaryColor: "#E8E7E6",
    backgroundImageUrl: "",
    logoUrl: "",
  };
}

/** Read cached branding from localStorage. Returns defaults (studio greens) if absent. */
export function getCachedBranding(): CachedBranding {
  if (typeof window === "undefined") return getDefaultBranding();
  try {
    const raw = localStorage.getItem(BRANDING_KEY);
    if (raw) return JSON.parse(raw) as CachedBranding;
  } catch {
    // corrupted data — ignore and return defaults
  }
  return getDefaultBranding();
}

/** Merge partial branding data into the cache. */
export function setCachedBranding(data: Partial<CachedBranding>): void {
  if (typeof window === "undefined") return;
  const merged = { ...getCachedBranding(), ...data };
  try {
    localStorage.setItem(BRANDING_KEY, JSON.stringify(merged));
  } catch {
    // localStorage full or unavailable — ignore
  }
}
