import { createContext } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  timeout?: number;
};

export type ToastCtx = {
  toast: (t: Omit<ToastItem, "id">) => void;
};

export const ToastContext = createContext<ToastCtx | null>(null);
