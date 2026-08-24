export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

/** Derive backend base URL from API_URL (strip /api/v1 suffix). */
const BACKEND_BASE = API_URL.replace(/\/api\/v1\/?$/, "");

/**
 * Resolve a relative upload path (e.g. /uploads/profiles/foo.jpg) to a full
 * backend URL. If the URL is already absolute or external, return as-is.
 */
export function resolveUploadUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_BASE}${path}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginCodeResponse {
  accessToken: string;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

/** Offline queue entry persisted in IndexedDB when network is unavailable. */
export interface OfflineRequest {
  id?: number;
  path: string;
  method: string;
  body?: unknown;
  timestamp: number;
  retryCount: number;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

/**
 * Thrown by apiFetch when the access token is missing or the server returns 401.
 * Callers should redirect to /login.
 */
export class AuthError extends Error {
  constructor() {
    super("Sesión expirada — inicia sesión de nuevo");
    this.name = "AuthError";
  }
}

/**
 * Thrown when the device is offline and the operation cannot be queued
 * (e.g. a read operation that requires fresh data).
 */
export class OfflineError extends Error {
  constructor() {
    super("Sin conexión — esta operación requiere internet");
    this.name = "OfflineError";
  }
}

// ─── Network detection ────────────────────────────────────────────────────────

/** Returns true if the browser reports being online. */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// ─── Offline queue (IndexedDB) ────────────────────────────────────────────────

const DB_NAME = "studio-pwa-offline";
const DB_VERSION = 1;
const STORE_NAME = "pendingRequests";

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Enqueue a write operation to be replayed when connectivity is restored. */
async function enqueueOffline(entry: Omit<OfflineRequest, "id" | "timestamp" | "retryCount">): Promise<void> {
  const db = await openOfflineDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.add({
    ...entry,
    timestamp: Date.now(),
    retryCount: 0,
  });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Replay all queued offline requests. Returns the number of successfully replayed entries. */
export async function replayOfflineQueue(): Promise<number> {
  if (!isOnline()) return 0;

  const db = await openOfflineDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const entries: OfflineRequest[] = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  let replayed = 0;
  for (const entry of entries) {
    try {
      await apiFetch(entry.path, {
        method: entry.method,
        body: entry.body ? JSON.stringify(entry.body) : undefined,
      });
      store.delete(entry.id!);
      replayed++;
    } catch {
      // If still failing, increment retry count and leave for next attempt.
      store.put({ ...entry, retryCount: (entry.retryCount || 0) + 1 });
    }
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(replayed);
    tx.onerror = () => reject(tx.error);
  });
}

/** Check how many requests are pending in the offline queue. */
export async function pendingOfflineCount(): Promise<number> {
  const db = await openOfflineDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Check whether a customer with the given email exists in the database.
 * Calls the public endpoint POST /client/check-customer.
 * Returns true if the email belongs to an active customer.
 */
export async function checkCustomerEmail(email: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/client/check-customer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Error al verificar el email. Intenta de nuevo.");
  }

  const data = await res.json();
  return data.exists === true;
}

/**
 * Request the login code be sent to the customer's email.
 * Calls the public endpoint POST /client/request-code with the email.
 * The backend always returns 200 with a generic message to avoid
 * email enumeration. If SMTP is not configured (dev mode), the code
 * is returned directly in the response.
 * Throws an error with a user-facing message on network failure.
 */
export async function requestCodeByEmail(email: string): Promise<{ code?: string; message?: string }> {
  const res = await fetch(`${API_URL}/client/request-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Error al solicitar el código. Intenta de nuevo.");
  }

  return res.json();
}

/**
 * Authenticate a customer (alumno) using their 6-character access code.
 * Stores the returned access token in localStorage on success.
 * Throws an error with a user-facing message on failure.
 */
export async function loginWithCode(code: string): Promise<LoginCodeResponse> {
  const res = await fetch(`${API_URL}/auth/login-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (res.status === 401 || res.status === 404) {
    throw new Error("Código inválido");
  }

  if (!res.ok) {
    throw new Error("Error del servidor. Intenta de nuevo.");
  }

  const data: LoginCodeResponse = await res.json();

  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("customerId", String(data.customer.id));
    localStorage.setItem("customerFirstName", data.customer.firstName);
    localStorage.setItem("customerLastName", data.customer.lastName);
  }

  return data;
}

// ─── Legal documents (acceptance flow) ─────────────────────────────────────

export interface PendingDocument {
  documentType: string;
  versionId: number;
  version: string;
  required: boolean;
  content: string;
}

export interface AccessStatusResponse {
  canAccess: boolean;
  requiresAcceptance: boolean;
  pendingDocuments: PendingDocument[];
}

export interface PendingDocumentsResponse {
  pending: PendingDocument[];
}

// ─── Legal document acceptance ──────────────────────────────────────────────

export async function checkAccessStatus(): Promise<AccessStatusResponse> {
  return apiFetch<AccessStatusResponse>("/client/access-status", { method: "GET" });
}

export async function getPendingDocuments(): Promise<PendingDocumentsResponse> {
  return apiFetch<PendingDocumentsResponse>("/client/legal-documents", { method: "GET" });
}

export async function recordAcceptance(versionId: number, accepted: boolean): Promise<{ id: number; versionId: number; accepted: boolean; acceptedAt: string }> {
  return apiFetch("/client/legal-acceptances", {
    method: "POST",
    body: JSON.stringify({ versionId, accepted }),
  });
}

export async function getAcceptanceStatus(versionId: number): Promise<{ versionId: number; accepted: boolean; acceptedAt?: string }> {
  return apiFetch(`/client/legal-acceptances/status?versionId=${versionId}`, { method: "GET" });
}

export async function getPublicLegalContent(docType: string): Promise<{ type: string; content: string; versionId?: number }> {
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/legal/public/${docType}`, { headers });
  if (!res.ok) throw new Error("No se pudo cargar el contenido legal");
  return res.json();
}

/** Returns the stored access token, or null if not authenticated. */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

/** Returns the stored customer ID, or null. */
export function getCustomerId(): number | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("customerId");
  return id ? Number(id) : null;
}

/** Removes the access token and customer data from localStorage. */
export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("customerId");
  localStorage.removeItem("customerFirstName");
  localStorage.removeItem("customerLastName");
}

// ─── API fetch wrapper ────────────────────────────────────────────────────────

/**
 * Network-first fetch wrapper for PWA API calls.
 *
 * Strategy:
 * - GET requests: network-first, no offline queuing (reads require fresh data).
 * - POST/PUT/DELETE requests: network-first. If offline (fetch fails), queue the
 *   operation in IndexedDB for replay when connectivity is restored.
 *
 * Customers receive a 24-hour access token with no refresh token.
 * On 401, clears the stored token and throws `AuthError` so callers
 * can redirect to /login.
 *
 * @param path    Path relative to API_URL, e.g. "/client/sessions"
 * @param options Standard RequestInit (method, body, headers…)
 * @returns The parsed JSON body, or undefined for 204 No Content.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new AuthError();
  }

  const method = (options.method ?? "GET").toUpperCase();

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers, method });

    if (res.status === 401) {
      clearToken();
      throw new AuthError();
    }

    if (res.status === 204) {
      return undefined as unknown as T;
    }

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {
        // ignore parse error
      }
      throw new Error(message);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    // If not a network error, rethrow immediately.
    if (err instanceof AuthError || err instanceof Error && err.name !== "TypeError") {
      throw err;
    }

    // Network error: try offline queuing for writes.
    const writableMethods = ["POST", "PUT", "PATCH", "DELETE"];
    if (writableMethods.includes(method)) {
      await enqueueOffline({
        path,
        method,
        body: options.body ? (typeof options.body === "string" ? JSON.parse(options.body as string) : options.body) : undefined,
      });
      // Return a synthetic success so the UI can proceed optimistically.
      return {
        id: -1,
        _offline: true,
        _message: "La operación se procesará cuando se recupere la conexión",
      } as unknown as T;
    }

    // GET requests can't be queued — throw offline error.
    throw new OfflineError();
  }
}
