import { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/useAuthStore";

type NavItem = {
  to: string;
  label: string;
  icon: string;
};

export function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const navItems: NavItem[] = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard", icon: "📊" },
      { to: "/products", label: "Produtos", icon: "📦" },
      { to: "/customers", label: "Clientes", icon: "👤" },
      { to: "/orders", label: "Vendas", icon: "🧾" },
      { to: "/reports", label: "Relatórios", icon: "📈" },
    ],
    [],
  );

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-50 h-screen w-[270px] border-r border-slate-800/40 bg-slate-900 text-white",
          "transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-800/50 px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-white/90">
                ERP System
              </div>
              <div className="text-xs text-white/50">Painel Administrativo</div>
            </div>

            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              Fechar
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold",
                    "transition",
                    isActive
                      ? "bg-white/10 text-white ring-1 ring-white/10"
                      : "text-white/70 hover:bg-white/5 hover:text-white",
                  ].join(" ")
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-800/50 p-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-xs font-semibold text-white/60">
                Logado como
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {user?.name ?? "Usuário"}
              </div>

              <button
                onClick={handleLogout}
                className="mt-4 w-full rounded-2xl bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-600"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                ☰ Menu
              </button>

              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Bem-vindo, {user?.name ?? "Usuário"}
                </div>
                <div className="text-xs text-slate-500">
                  Gerencie produtos, clientes e vendas
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm sm:block">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </div>
              <button
                onClick={toggle}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                title={
                  theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"
                }
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                {(user?.name?.[0] ?? "U").toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
