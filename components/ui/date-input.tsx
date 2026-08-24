"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface DateInputProps {
  id?: string;
  value: string; // "YYYY-MM-DD" o ""
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// "YYYY-MM-DD" -> "dd/mm/aaaa" (sin pasar por Date, evita desfases de zona horaria)
function formatDisplay(value: string): string {
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function toISODate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// Lunes de la semana que contiene el día 1 del mes (rejilla fija de 6 semanas)
function getGridStart(year: number, month: number): Date {
  const dow = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0=Dom..6=Sáb
  const offset = dow === 0 ? -6 : 1 - dow;
  return new Date(Date.UTC(year, month, 1 + offset));
}

export function DateInput({
  id,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  ariaLabel,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => new Date());

  const openPicker = () => {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      setViewDate(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)));
    } else {
      const now = new Date();
      setViewDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
    }
    setOpen(true);
  };

  const toggle = () => {
    if (open) setOpen(false);
    else openPicker();
  };

  const prevMonth = () =>
    setViewDate((d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)));
  const nextMonth = () =>
    setViewDate((d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)));

  const gridStart = getGridStart(viewDate.getUTCFullYear(), viewDate.getUTCMonth());
  const days = Array.from({ length: 42 }, (_, i) =>
    new Date(Date.UTC(gridStart.getUTCFullYear(), gridStart.getUTCMonth(), gridStart.getUTCDate() + i))
  );
  const todayISO = toISODate(new Date());
  const currentYear = viewDate.getUTCFullYear();
  const currentMonth = viewDate.getUTCMonth();

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        onClick={toggle}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500",
          value ? "pr-9" : "pr-3",
          !value && "text-gray-400"
        )}
      >
        <span className="flex-1 truncate text-left">
          {value ? formatDisplay(value) : placeholder}
        </span>
        {!value && (
          <svg
            className="h-4 w-4 shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )}
      </button>

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar fecha"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Mes anterior"
                className="rounded-md p-1 hover:bg-gray-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className="text-sm font-medium text-gray-700">
                {MONTHS[currentMonth]} {currentYear}
              </div>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Mes siguiente"
                className="rounded-md p-1 hover:bg-gray-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7">
              {DAY_LABELS.map((label) => (
                <div key={label} className="py-1 text-center text-xs text-gray-400">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day) => {
                const iso = toISODate(day);
                const inMonth = day.getUTCMonth() === currentMonth && day.getUTCFullYear() === currentYear;
                const isSelected = iso === value;
                const isToday = iso === todayISO;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-md text-sm transition-colors",
                      !inMonth && "text-gray-300",
                      isSelected ? "bg-brand-500 text-white" : "hover:bg-gray-100",
                      isToday && !isSelected && "ring-1 ring-inset ring-brand-500"
                    )}
                  >
                    {day.getUTCDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                Limpiar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
