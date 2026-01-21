import React from "react";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

const styles: Record<Variant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-indigo-50 text-indigo-700 border-indigo-200",
  neutral: "bg-slate-50 text-slate-700 border-slate-200",
};

export function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        styles[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
