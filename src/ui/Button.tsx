import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "shadow-sm",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
      )}
      {children}
    </button>
  );
}
