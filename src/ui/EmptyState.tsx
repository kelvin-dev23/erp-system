import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-xl">
          🗂️
        </div>

        <h3 className="text-base font-semibold text-slate-900">{title}</h3>

        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}

        {actionLabel && onAction && (
          <div className="mt-4 flex justify-center">
            <Button onClick={onAction}>{actionLabel}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
