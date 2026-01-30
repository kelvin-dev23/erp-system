import { useState } from "react";

type Action = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

type ActionsMenuProps = {
  actions: Action[];
};

export function ActionsMenu({ actions }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg px-2 py-1 text-lg hover:bg-slate-100"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                a.onClick();
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                a.danger ? "text-red-600" : ""
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
