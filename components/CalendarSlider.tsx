"use client";

import { useRef, useEffect } from "react";

export interface CalendarDay {
  date: string;       // "YYYY-MM-DD"
  number: number;     // 1-31
  weekday: string;    // "L", "M", "X"...
  month: string;      // "ENE", "FEB"...
  isFirstOfMonth: boolean;
}

interface CalendarSliderProps {
  days: CalendarDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
  primaryColor: string;
}

const MONTH_NAMES: Record<number, string> = {
  0: "ENE", 1: "FEB", 2: "MAR", 3: "ABR",
  4: "MAY", 5: "JUN", 6: "JUL", 7: "AGO",
  8: "SEP", 9: "OCT", 10: "NOV", 11: "DIC",
};

const WEEKDAY_NAMES: Record<number, string> = {
  0: "D", 1: "L", 2: "M", 3: "X",
  4: "J", 5: "V", 6: "S",
};

/** Genera los días del calendario según calendarDays (MON_SUN, MON_SAT, MON_FRI).
 *  Devuelve 2 semanas desde el lunes de la semana actual. */
export function generateCalendarDays(
  calendarDays?: string,
  referenceDate?: Date
): CalendarDay[] {
  const now = referenceDate ?? new Date();
  // Ir al lunes de esta semana (lunes = 1)
  const dayOfWeek = now.getDay(); // 0=Domingo
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  // Determinar días activos
  let activeWeekdays: number[];
  switch (calendarDays) {
    case "MON_SUN":
      activeWeekdays = [0, 1, 2, 3, 4, 5, 6];
      break;
    case "MON_SAT":
      activeWeekdays = [1, 2, 3, 4, 5, 6];
      break;
    case "MON_FRI":
    default:
      activeWeekdays = [1, 2, 3, 4, 5];
      break;
  }

  const days: CalendarDay[] = [];
  let lastMonth = -1;

  // Generar 14 días desde el lunes
  for (let i = 0; i < 14; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const dow = d.getDay(); // 0-6
    if (!activeWeekdays.includes(dow)) continue;

    const month = d.getMonth();
    const isFirstOfMonth = month !== lastMonth;
    lastMonth = month;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    days.push({
      date: `${yyyy}-${mm}-${dd}`,
      number: d.getDate(),
      weekday: WEEKDAY_NAMES[dow],
      month: MONTH_NAMES[month],
      isFirstOfMonth,
    });
  }

  return days;
}

/** Obtiene la fecha de hoy en YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CalendarSlider({
  days,
  selectedDate,
  onSelect,
  primaryColor,
}: CalendarSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll al día seleccionado
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDate]);

  if (days.length === 0) return null;

  return (
    <div className="flex-shrink-0 bg-white border-b border-gray-100">
      <div
        ref={scrollRef}
        className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-hide"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
        }}
      >
        {days.map((day) => {
          const isSelected = day.date === selectedDate;
          const isToday = day.date === todayStr();

          return (
            <button
              key={day.date}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => onSelect(day.date)}
              className="flex flex-col items-center justify-center flex-shrink-0 w-14 h-[72px] rounded-xl transition-all duration-200 active:scale-95 snap-center"
              style={{
                backgroundColor: isSelected ? primaryColor : "transparent",
                border: isToday && !isSelected
                  ? `1.5px solid ${primaryColor}40`
                  : "1.5px solid transparent",
              }}
            >
              <span
                className="text-[11px] font-semibold leading-none"
                style={{ color: isSelected ? "#ffffffcc" : "#9CA3AF" }}
              >
                {day.weekday}
              </span>
              <span
                className="text-lg font-bold leading-tight mt-0.5"
                style={{ color: isSelected ? "#ffffff" : "#1F2937" }}
              >
                {day.number}
              </span>
              <span
                className="text-[10px] font-medium leading-none mt-0.5"
                style={{ color: isSelected ? "#ffffff99" : "#9CA3AF" }}
              >
                {day.month}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
