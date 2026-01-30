type Crumb = {
  label: string;
};

type BreadcrumbProps = {
  items: Crumb[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span
            className={
              i === items.length - 1 ? "text-slate-900 font-medium" : ""
            }
          >
            {item.label}
          </span>

          {i < items.length - 1 && <span>/</span>}
        </span>
      ))}
    </nav>
  );
}
