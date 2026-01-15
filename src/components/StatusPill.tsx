// src/components/StatusPill.tsx
import React from "react";

type PillVariant = "good" | "warn" | "bad" | "info" | "neutral";

export function StatusPill({
  variant = "neutral",
  label,
  className = "",
}: {
  variant?: PillVariant;
  label: string;
  className?: string;
}) {
  const styles =
    variant === "good"
      ? "bg-green-100 text-green-800 border-green-200"
      : variant === "warn"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : variant === "bad"
      ? "bg-red-100 text-red-800 border-red-200"
      : variant === "info"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles,
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
