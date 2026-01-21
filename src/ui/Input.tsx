import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helper?: string;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Input({ label, error, helper, className, ...props }: Props) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </span>
      )}

      <input
        {...props}
        className={cn(
          "h-10 w-full rounded-xl border bg-white px-3 text-sm text-slate-900",
          "border-slate-200 outline-none transition",
          "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
          error &&
            "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20",
          className,
        )}
      />

      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : helper ? (
        <span className="mt-1 block text-xs text-slate-500">{helper}</span>
      ) : null}
    </label>
  );
}
