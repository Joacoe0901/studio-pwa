"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiFetch,
  createCheckout,
  fetchAssignedMonthlyVouchers,
  fetchPurchasableVouchers,
  getAccessToken,
} from "@/lib/api";
import type {
  CustomerVoucherResponse,
  PurchasableVoucher,
} from "@/lib/types";

const MONTHS = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

function friendlyError(err: unknown): string {
  if (err instanceof Error && err.message === "online payments are not configured") {
    return "Los pagos online aún no están disponibles.";
  }
  return err instanceof Error ? err.message : "Error inesperado.";
}

export default function ComprarBonosPage() {
  const router = useRouter();
  const [purchasable, setPurchasable] = useState<PurchasableVoucher[]>([]);
  const [monthly, setMonthly] = useState<CustomerVoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#53593D");

  useEffect(() => {
    apiFetch<{ primaryColor: string }>("/client/company")
      .then((d) => setPrimaryColor(d.primaryColor || "#53593D"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }

    Promise.allSettled([
      fetchPurchasableVouchers(),
      fetchAssignedMonthlyVouchers(),
    ])
      .then(([catalog, assigned]) => {
        if (catalog.status === "fulfilled") {
          setPurchasable(catalog.value);
        } else {
          setError(friendlyError(catalog.reason));
        }
        if (assigned.status === "fulfilled") setMonthly(assigned.value);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleBuy = async (key: string, voucherId: number, customerVoucherId?: number) => {
    setBusyKey(key);
    setError(null);
    try {
      const origin = window.location.origin;
      const checkout = await createCheckout(voucherId, customerVoucherId, {
        successUrl: `${origin}/comprar/resultado`,
        cancelUrl: `${origin}/comprar`,
      });
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      setError(friendlyError(err));
      setBusyKey(null);
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
        <h1 className="text-lg font-bold text-white">Comprar Bonos</h1>
      </header>

      <main className="flex-1 min-h-0 px-6 pt-4 pb-10 space-y-6 overflow-y-auto">
        {loading ? (
          <p className="text-gray-400 text-sm">Cargando bonos disponibles...</p>
        ) : (
          <>
            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            )}

            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Bonos disponibles
              </h2>
              {purchasable.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay bonos disponibles para comprar por ahora.</p>
              ) : (
                <div className="space-y-3">
                  {purchasable.map((v) => {
                    const key = `credits-${v.id}`;
                    return (
                      <div key={key} className="rounded-xl border border-gray-100 p-4 bg-gray-50">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{v.name}</p>
                            {v.totalCredits != null && (
                              <p className="text-sm text-gray-500">{v.totalCredits} clases</p>
                            )}
                          </div>
                          <span className="font-bold text-gray-900">{formatPrice(v.priceCents)}</span>
                        </div>
                        <button
                          onClick={() => handleBuy(key, v.id)}
                          disabled={busyKey === key}
                          className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {busyKey === key ? "Redirigiendo..." : "Comprar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Pendientes de pago
              </h2>
              {monthly.length === 0 ? (
                <p className="text-gray-400 text-sm">No tienes mensualidades pendientes de pago.</p>
              ) : (
                <div className="space-y-3">
                  {monthly.map((v) => {
                    const key = `monthly-${v.id}`;
                    return (
                      <div key={key} className="rounded-xl border border-gray-100 p-4 bg-gray-50">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{v.voucherName || v.serviceName}</p>
                            <p className="text-sm text-gray-500">
                              {v.serviceName} · {MONTHS[v.periodMonth] || ""} {v.periodYear}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleBuy(key, v.voucherId, v.id)}
                          disabled={busyKey === key}
                          className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {busyKey === key ? "Redirigiendo..." : "Pagar mensualidad"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
