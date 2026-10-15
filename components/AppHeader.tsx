"use client";

import { useRouter } from "next/navigation";

interface AppHeaderProps {
  title: string;
  primaryColor: string;
  showBack?: boolean;
}

export default function AppHeader({
  title,
  primaryColor,
  showBack = true,
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="flex-shrink-0 px-4 pt-safe-top pb-3 flex items-center gap-3"
      style={{ backgroundColor: primaryColor }}
    >
      {showBack && (
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="p-1 text-white/80 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
      )}

      <h1 className="text-lg font-bold text-white">{title}</h1>

      <button
        onClick={() => router.push("/home")}
        aria-label="Ir al inicio"
        className="ml-auto p-1 text-white/80 hover:text-white transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      </button>
    </header>
  );
}
