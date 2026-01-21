import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useMemo } from "react";
import { getDashboard } from "../services/dashboardApi";
import { listProducts, type Product } from "../services/productsApi";

import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader } from "../ui/Card";

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });
  const qProducts = useQuery({
    queryKey: ["products", "dashboard-alerts"],
    queryFn: () => listProducts(""),
  });

  const products = useMemo(
    () => (qProducts.data ?? []) as Product[],
    [qProducts.data],
  );

  const outOfStock = useMemo(
    () => products.filter((p) => p.stock === 0).slice(0, 5),
    [products],
  );

  const lowStock = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= 5).slice(0, 5),
    [products],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">📊 Dashboard</h1>
        <div className="text-sm text-slate-600">Carregando dashboard...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">📊 Dashboard</h1>
        <div className="text-sm text-rose-600">
          Erro: {(error as Error)?.message}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">📊 Dashboard</h1>
        <div className="text-sm text-slate-600">Sem dados.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">📊 Dashboard</h1>
        <p className="text-sm text-slate-500">
          Acompanhe indicadores e resultados do sistema.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Produtos"
          subtitle="cadastrados"
          value={data.totalProducts}
        />
        <KpiCard
          title="Clientes"
          subtitle="ativos"
          value={data.totalCustomers}
        />
        <KpiCard
          title="Vendas"
          subtitle="registradas"
          value={data.totalSales}
        />
        <KpiCard
          title="Faturamento"
          subtitle="pagas"
          value={money(data.revenue)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Vendas na semana"
            subtitle="(somente pagas)"
            right={<div className="text-xs text-slate-500">Últimos 7 dias</div>}
          />
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.salesChart}
                  margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(v) => money(Number(v))} width={80} />
                  <Tooltip
                    formatter={(value) => money(Number(value))}
                    labelFormatter={(label) => `Dia: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Últimas vendas"
            subtitle={`${data.lastSales.length} registro(s)`}
          />
          <CardContent className="space-y-3">
            <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
              {data.lastSales.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-slate-900">{s.id}</strong>
                    <OrderStatusBadge status={s.status} />
                  </div>

                  <div className="mt-1 text-sm text-slate-700">
                    {s.customer}
                  </div>

                  <div className="mt-2 text-base font-extrabold text-slate-900">
                    {money(s.total)}
                  </div>
                </div>
              ))}

              {data.lastSales.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Nenhuma venda recente.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            title="Alertas de estoque"
            subtitle="Produtos com risco de ruptura"
            right={
              <Link
                to="/products?alerts=1"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Ver produtos →
              </Link>
            }
          />

          <CardContent className="space-y-4">
            {qProducts.isLoading && (
              <div className="text-sm text-slate-600">
                Carregando alertas...
              </div>
            )}

            {qProducts.isError && (
              <div className="text-sm text-rose-600">
                Erro ao carregar produtos.
              </div>
            )}

            {!qProducts.isLoading && !qProducts.isError && (
              <div className="grid gap-3 md:grid-cols-2">
                {/* Sem estoque */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-rose-800">
                      Sem estoque
                    </strong>
                    <Badge variant="danger">{outOfStock.length}</Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    {outOfStock.length === 0 ? (
                      <div className="text-sm text-rose-700/80">
                        Nenhum produto zerado
                      </div>
                    ) : (
                      outOfStock.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {p.name}
                            </div>
                            <div className="text-xs text-slate-600">
                              SKU: {p.sku}
                            </div>
                          </div>
                          <span className="text-sm font-black text-rose-700">
                            0
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-amber-900">
                      Estoque baixo
                    </strong>
                    <Badge variant="warning">{lowStock.length}</Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    {lowStock.length === 0 ? (
                      <div className="text-sm text-amber-800/80">
                        Nenhum produto com baixo estoque ✅
                      </div>
                    ) : (
                      lowStock.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {p.name}
                            </div>
                            <div className="text-xs text-slate-600">
                              SKU: {p.sku}
                            </div>
                          </div>
                          <span className="text-sm font-black text-amber-900">
                            {p.stock}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  subtitle,
  value,
}: {
  title: string;
  subtitle?: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          {subtitle ? (
            <span className="text-xs font-semibold text-slate-500">
              {subtitle}
            </span>
          ) : null}
        </div>

        <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

<Card>
  <CardHeader
    title="Alertas de estoque"
    subtitle="Produtos com risco de ruptura"
    right={
      <Link
        to="/products?alerts=1"
        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
      >
        Ver produtos →
      </Link>
    }
  />

  <CardContent className="space-y-3">
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <div className="flex items-center justify-between">
        <strong className="text-sm text-rose-800">Sem estoque</strong>
        <Badge variant="danger">CRÍTICO</Badge>
      </div>

      <p className="mt-1 text-sm text-rose-700">
        Verifique os produtos com estoque zerado.
      </p>
    </div>

    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between">
        <strong className="text-sm text-amber-800">Estoque baixo</strong>
        <Badge variant="warning">ATENÇÃO</Badge>
      </div>

      <p className="mt-1 text-sm text-amber-700">
        Produtos com estoque &le; 5 precisam de reposição.
      </p>
    </div>
  </CardContent>
</Card>;

function OrderStatusBadge({ status }: { status: string }) {
  if (status === "Pago") return <Badge variant="success">Pago</Badge>;
  if (status === "Pendente") return <Badge variant="warning">Pendente</Badge>;
  return <Badge variant="danger">Cancelado</Badge>;
}
