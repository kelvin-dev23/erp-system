import { useContext } from "react";
import { ToastContext } from "./toastContext";

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro do ToastProvider");
  return ctx;
}
