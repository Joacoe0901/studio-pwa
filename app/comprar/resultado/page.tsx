"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchOrderStatus, getAccessToken } from "@/lib/api";
import type { PurchaseOrderResponse, PurchaseOrderStatus } from "@/lib/types";

const TERMINAL: PurchaseOrderStatus[] = ["COMPLETED", "FAILED", "EXPIRED", "CANCELLED"];

function ResultadoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = Number(searchParams.get("order_id"));
  const [order, setOrder] = useState<PurchaseOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setError("No se encontró la referencia del pago.");
      return;
    }
    try {
      const data = await fetchOrderStatus(orderId);
      setOrder(data);
      if (TERMINAL.includes(data.status)) {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar el estado del pago.");
    }
  }, [orderId]);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setError("No se encontró la referencia del pago.");
      return;
    }
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [orderId, poll, router]);

  const status = order?.status;

  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-4 pt-safe-top pb-3 flex items-center gap-3" style={{ backgroundColor: "#53593D" }}>
        <h1 className="text-lg font-bold text-white">Estado del pago</h1>
      </header>

      <main className="flex-1 min-h-0 px-6 pt-8 pb-10 flex flex-col items-center justify-center text-center space-y-4">
        {status === "COMPLETED" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">¡Pago confirmado!</h2>
            <p className="text-sm text-gray-500">Tu bono ya está activo. Puedes reservar tus clases.</p>
            <button
              onClick={() => router.push("/bonos")}
              className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#53593D" }}
            >
              Ir a Mis Bonos
            </button>
          </>
        ) : status === "FAILED" || status === "EXPIRED" || status === "CANCELLED" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">El pago no se completó</h2>
            <p className="text-sm text-gray-500">
              {status === "EXPIRED"
                ? "La sesión de pago caducó."
                : status === "CANCELLED"
                  ? "El pago fue cancelado."
                  : "Hubo un problema con el pago."}
            </p>
            <button
              onClick={() => router.push("/comprar")}
              className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#53593D" }}
            >
              Volver a comprar
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {status === "UNRECONCILED" ? "Confirmando pago..." : "Procesando pago..."}
            </h2>
            <p className="text-sm text-gray-500">
              {error
                ? error
                : status === "UNRECONCILED"
                  ? "Hemos recibido tu pago. Estamos confirmándolo."
                  : "Espera un momento mientras confirmamos tu pago."}
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense
      fallback={
        <div className="h-dvh bg-white flex items-center justify-center">
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      }
    >
      <ResultadoInner />
    </Suspense>
  );
}
