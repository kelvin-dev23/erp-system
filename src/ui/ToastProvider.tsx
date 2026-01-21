import React, { useCallback, useMemo, useState } from "react";
import type { ToastItem } from "./toastContext";
import { ToastContext } from "./toastContext";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = uid();
      const item: ToastItem = { id, timeout: 3200, ...t };
      setItems((prev) => [...prev, item]);
      window.setTimeout(() => remove(id), item.timeout ?? 3200);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed right-4 top-4 z-[9999] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-sky-200 bg-sky-50 text-sky-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  }[item.variant];

  const dot = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-sky-600",
    warning: "bg-amber-600",
  }[item.variant];

  return (
    <div className={`rounded-2xl border p-4 shadow-lg ${styles}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-3 w-3 rounded-full ${dot}`} />
        <div className="min-w-0 flex-1">
          {item.title && (
            <div className="text-sm font-semibold">{item.title}</div>
          )}
          <div className="text-sm opacity-90">{item.message}</div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg px-2 text-lg leading-none opacity-70 hover:opacity-100"
          aria-label="Fechar"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}
