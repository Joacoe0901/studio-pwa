// ─── Push Manager ────────────────────────────────────────────────────────────
// Handles Web Push subscription flow: permission request, VAPID key conversion,
// pushManager.subscribe, and persisting the subscription to the backend.
//
// Must be called from a user gesture (button click) to comply with iOS Safari.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

/** Convert a Base64 URL-safe VAPID public key to Uint8Array. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Check if the current browser/environment supports Web Push. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Check current notification permission state. */
export function getNotificationPermission(): NotificationPermission {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

/**
 * Fetch the VAPID public key from the backend.
 * The endpoint is public (no auth required) so this can be called before login.
 */
export async function fetchVAPIDPublicKey(): Promise<string> {
  const res = await fetch(`${API_URL}/push/vapid-public-key`);
  if (!res.ok) {
    throw new Error("No se pudo obtener la clave VAPID del servidor");
  }
  const data = await res.json();
  return data.vapidPublicKey as string;
}

/**
 * Request notification permission and subscribe the device to Web Push.
 *
 * Flow:
 * 1. Check browser support (serviceWorker + PushManager + Notification).
 * 2. Request notification permission (must be triggered by user gesture).
 * 3. Wait for the active service worker registration.
 * 4. Subscribe via pushManager.subscribe with the VAPID public key.
 * 5. Send the subscription object to the backend for persistence.
 *
 * @param accessToken JWT access token for authenticating the subscription request.
 * @returns The PushSubscription object.
 */
export async function subscribeToPush(accessToken: string): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error(
      "Las notificaciones push no son compatibles con este navegador."
    );
  }

  // 1. Request permission — MUST be triggered by user gesture on iOS.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      "Debes permitir las notificaciones para recibir avisos del estudio."
    );
  }

  // 2. Get the VAPID public key from the backend.
  const vapidPublicKey = await fetchVAPIDPublicKey();

  // 3. Wait for the active service worker.
  const registration = await navigator.serviceWorker.ready;

  // 4. Subscribe to push.
  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey,
  });

  // 5. Send subscription to backend.
  const res = await fetch(`${API_URL}/client/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(subscription),
  });

  if (!res.ok) {
    // If backend rejected, try to unsubscribe locally so state is consistent.
    await subscription.unsubscribe().catch(() => {});
    throw new Error("No se pudo registrar la suscripción en el servidor.");
  }

  // Persist that we're subscribed in localStorage.
  try {
    localStorage.setItem("pushSubscribed", "true");
  } catch {
    // ignore
  }

  return subscription;
}

/**
 * Unsubscribe the device from Web Push and notify the backend.
 *
 * @param accessToken JWT access token for authenticating the request.
 */
export async function unsubscribeFromPush(accessToken: string): Promise<void> {
  // Remove local subscription
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }

  // Notify backend
  await fetch(`${API_URL}/client/push/unsubscribe`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  try {
    localStorage.removeItem("pushSubscribed");
  } catch {
    // ignore
  }
}

/** Check if the user has previously subscribed (localStorage flag). */
export function isSubscribed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("pushSubscribed") === "true";
  } catch {
    return false;
  }
}

/**
 * Refresh the push subscription state by checking with the browser's
 * pushManager. Returns true if currently subscribed, false otherwise.
 */
export async function checkSubscription(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  const hasSub = subscription !== null;
  try {
    if (hasSub) {
      localStorage.setItem("pushSubscribed", "true");
    } else {
      localStorage.removeItem("pushSubscribed");
    }
  } catch {
    // ignore
  }
  return hasSub;
}
