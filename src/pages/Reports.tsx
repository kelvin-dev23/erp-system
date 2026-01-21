import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { listCustomers } from "../services/customersApi";
import { listOrders, type OrderStatus } from "../services/ordersApi";
import { listProducts } from "../services/productsApi";

// UI
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader } from "../ui/Card";

type RangeKey = "today" | "7d" | "30d" | "all";

type ReportOrderItem = {
  productName?: string;
  qty?: number;
};

type ReportOrder = {
  id: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  items?: ReportOrderItem[];
  createdAt: string;
};
type ReportProduct = { stock: number };

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function statusVariant(status: OrderStatus) {
  if (status === "Pago") return "success";
  if (status === "Cancelado") return "danger";
  return "warning";
}

function rangeLabel(range: RangeKey) {
  if (range === "today") return "Hoje";
  if (range === "7d") return "Últimos 7 dias";
  if (range === "30d") return "Últimos 30 dias";
  return "Tudo";
}

export function Reports() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [status, setStatus] = useState<
    "all" | "Pago" | "Pendente" | "Cancelado"
  >("all");

  const qOrders = useQuery({
    queryKey: ["orders", "reports"],
    queryFn: () => listOrders(""),
  });

  const qCustomers = useQuery({
    queryKey: ["customers", "reports"],
    queryFn: () => listCustomers(""),
  });

  const qProducts = useQuery({
    queryKey: ["products", "reports"],
    queryFn: () => listProducts(""),
  });

  const isLoading =
    qOrders.isLoading || qCustomers.isLoading || qProducts.isLoading;
  const isError = qOrders.isError || qCustomers.isError || qProducts.isError;

  const orders = useMemo(
    () => (qOrders.data ?? []) as ReportOrder[],
    [qOrders.data],
  );
  const customers = useMemo(() => qCustomers.data ?? [], [qCustomers.data]);
  const products = useMemo(
    () => (qProducts.data ?? []) as ReportProduct[],
    [qProducts.data],
  );

  const filteredOrders = useMemo(() => {
    const base = orders;

    if (range === "all") return base;

    const now = new Date();

    const from =
      range === "today"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        : range === "7d"
          ? now.getTime() - 7 * 24 * 60 * 60 * 1000
          : now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return base.filter((o) => new Date(o.createdAt).getTime() >= from);
  }, [orders, range]);

  const filteredOrders2 = useMemo(() => {
    const base = filteredOrders;
    if (status === "all") return base;
    return base.filter((o) => o.status === status);
  }, [filteredOrders, status]);

  const kpis = useMemo(() => {
    const paid = filteredOrders2.filter((o) => o.status === "Pago");
    const pending = filteredOrders2.filter((o) => o.status === "Pendente");
    const canceled = filteredOrders2.filter((o) => o.status === "Cancelado");

    const revenue = paid.reduce((acc, o) => acc + (o.total ?? 0), 0);

    const outOfStock = products.filter((p) => p.stock === 0).length;

    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;

    return {
      totalOrders: filteredOrders2.length,
      paid: paid.length,
      pending: pending.length,
      canceled: canceled.length,
      revenue,
      customers: customers.length,
      products: products.length,
      outOfStock,
      lowStock,
    };
  }, [filteredOrders2, customers, products]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>(); // productName -> qty

    for (const o of filteredOrders2) {
      for (const it of o.items ?? []) {
        const name = it.productName ?? "Produto";
        const qty = Number(it.qty ?? 0);
        map.set(name, (map.get(name) ?? 0) + qty);
      }
    }

    return [...map.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [filteredOrders2]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();

    for (const o of filteredOrders2) {
      const name = o.customerName ?? "Cliente";
      const total = Number(o.total ?? 0);
      const cur = map.get(name) ?? { total: 0, count: 0 };
      map.set(name, { total: cur.total + total, count: cur.count + 1 });
    }

    return [...map.entries()]
      .map(([name, v]) => ({ name, total: v.total, count: v.count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredOrders2]);
  const chartData = useMemo(() => {
    const map = new Map<
      string,
      { day: string; revenue: number; orders: number }
    >();

    for (const o of filteredOrders2) {
      const day = new Date(o.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

      const current = map.get(day) ?? { day, revenue: 0, orders: 0 };

      const value = o.status === "Pago" ? Number(o.total ?? 0) : 0;

      map.set(day, {
        day,
        revenue: current.revenue + value,
        orders: current.orders + 1,
      });
    }

    const sorted = [...filteredOrders2]
      .map((o) => ({
        dayKey: new Date(o.createdAt).toISOString().slice(0, 10),
        dayLabel: new Date(o.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
      }))
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey));

    const uniqueDays = Array.from(
      new Map(sorted.map((d) => [d.dayKey, d])).values(),
    );

    return uniqueDays.map((d) => {
      const item = map.get(d.dayLabel);
      return {
        day: d.dayLabel,
        revenue: item?.revenue ?? 0,
        orders: item?.orders ?? 0,
      };
    });
  }, [filteredOrders2]);

  function exportCsv() {
    const rows = [
      ["id", "customer", "total", "status"],
      ...filteredOrders2.map((o) => [
        o.id,
        o.customerName,
        String(o.total),
        o.status,
      ]),
    ];

    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? "");
            const escaped = s.replaceAll('"', '""');
            return `"${escaped}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_vendas_${range}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const now = new Date();
    const headerDate = now.toLocaleString("pt-BR");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const totalOrders = filteredOrders2.length;
    const paidOrders = filteredOrders2.filter(
      (o) => o.status === "Pago",
    ).length;
    const pendingOrders = filteredOrders2.filter(
      (o) => o.status === "Pendente",
    ).length;
    const canceledOrders = filteredOrders2.filter(
      (o) => o.status === "Cancelado",
    ).length;

    const totalRevenue = filteredOrders2
      .filter((o) => o.status === "Pago")
      .reduce((acc, o) => acc + (o.total ?? 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ERP System", 14, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Relatório de Vendas", 14, 22);
    doc.text(`Gerado em: ${headerDate}`, 14, 27);
    doc.text(`Filtro: ${rangeLabel(range)} • Status: ${status}`, 14, 32);

    doc.setDrawColor(220);
    doc.line(14, 36, pageWidth - 14, 36);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Resumo", 14, 45);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`• Pedidos: ${totalOrders}`, 14, 51);
    doc.text(`• Receita (pagas): ${money(totalRevenue)}`, 14, 56);
    doc.text(`• Pagos: ${paidOrders}`, 14, 61);
    doc.text(`• Pendentes: ${pendingOrders}`, 14, 66);
    doc.text(`• Cancelados: ${canceledOrders}`, 14, 71);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Top Produtos", 14, 82);

    autoTable(doc, {
      startY: 86,
      head: [["Produto", "Quantidade"]],
      body: topProducts.map((p) => [p.name, String(p.qty)]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
    });

    const lastY1 =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? 110;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Top Clientes", 14, lastY1 + 12);

    autoTable(doc, {
      startY: lastY1 + 16,
      head: [["Cliente", "Pedidos", "Total"]],
      body: topCustomers.map((c) => [c.name, String(c.count), money(c.total)]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
    });

    const lastY2 =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? 160;

    const lastOrders = [...filteredOrders2].slice(0, 12);

    const pageNeedsNew = lastY2 + 20 > pageHeight - 20;
    if (pageNeedsNew) doc.addPage();

    const baseY = pageNeedsNew ? 16 : lastY2 + 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Últimas Vendas", 14, baseY);

    autoTable(doc, {
      startY: baseY + 4,
      head: [["Id", "Cliente", "Total", "Status"]],
      body: lastOrders.map((o) => [
        o.id,
        o.customerName,
        money(o.total),
        o.status,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
      },
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120);

      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - 14,
        pageHeight - 10,
        {
          align: "right",
        },
      );
      doc.text("ERP System • Relatório", 14, pageHeight - 10);
    }

    doc.save(`relatorio-erp-${now.toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            📈 Relatórios
          </h1>
          <p className="text-sm text-slate-500">
            Indicadores, ranking e exportação CSV/PDF.
          </p>
        </div>

        <div className="sm:ml-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 sm:w-[220px]"
          >
            <option value="today">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="all">Tudo</option>
          </select>

          <Button
            onClick={exportCsv}
            variant="secondary"
            className="whitespace-nowrap"
          >
            Exportar CSV
          </Button>

          <Button
            onClick={exportPDF}
            variant="secondary"
            className="whitespace-nowrap"
          >
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="text-xs font-semibold text-slate-500">
        Período selecionado:{" "}
        <span className="text-slate-800">{rangeLabel(range)}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Status:</span>

        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value as "all" | "Pago" | "Pendente" | "Cancelado",
            )
          }
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
        >
          <option value="all">Todos</option>
          <option value="Pago">Pago</option>
          <option value="Pendente">Pendente</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {isLoading && (
        <div className="text-sm text-slate-600">Carregando relatórios...</div>
      )}

      {isError && (
        <div className="text-sm text-rose-600">
          Erro ao carregar relatórios (ver console).
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi title="Receita (pagas)" value={money(kpis.revenue)} />
            <Kpi title="Vendas" value={kpis.totalOrders} hint="registros" />
            <Kpi title="Pendentes" value={kpis.pending} />
            <Kpi title="Canceladas" value={kpis.canceled} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi title="Clientes" value={kpis.customers} />
            <Kpi title="Produtos" value={kpis.products} />
            <Kpi title="Sem estoque" value={kpis.outOfStock} />
            <Kpi title="Estoque baixo" value={kpis.lowStock} />
          </div>

          {/* Tops */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Top produtos (quantidade)"
                subtitle={`${topProducts.length} item(ns)`}
              />
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Produto</th>
                        <th className="px-5 py-3 font-semibold">Qtd</th>
                        <th className="px-5 py-3 font-semibold">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topProducts.length === 0 ? (
                        <tr>
                          <td className="px-5 py-8 text-slate-500" colSpan={2}>
                            Sem dados.
                          </td>
                          <td className="px-5 py-4 text-slate-700"></td>
                        </tr>
                      ) : (
                        topProducts.map((p) => (
                          <tr key={p.name} className="hover:bg-slate-50/60">
                            <td className="px-5 py-4 font-medium text-slate-900">
                              {p.name}
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {p.qty}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Top clientes (valor)"
                subtitle={`${topCustomers.length} item(ns)`}
              />
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Cliente</th>
                        <th className="px-5 py-3 font-semibold">Compras</th>
                        <th className="px-5 py-3 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topCustomers.length === 0 ? (
                        <tr>
                          <td className="px-5 py-8 text-slate-500" colSpan={3}>
                            Sem dados.
                          </td>
                        </tr>
                      ) : (
                        topCustomers.map((c) => (
                          <tr key={c.name} className="hover:bg-slate-50/60">
                            <td className="px-5 py-4 font-medium text-slate-900">
                              {c.name}
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {c.count}
                            </td>
                            <td className="px-5 py-4 text-slate-900">
                              {money(c.total)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Vendas por dia"
              subtitle="Receita (apenas Pagas) e quantidade de pedidos"
            />
            <CardContent className="h-[320px]">
              {chartData.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-slate-500">
                  Sem dados para exibir no gráfico.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickMargin={8} />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="revenue"
                      name="Receita"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Vendas (lista)"
              subtitle={`${filteredOrders2.length} registro(s)`}
            />
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Id</th>
                      <th className="px-5 py-3 font-semibold">Cliente</th>
                      <th className="px-5 py-3 font-semibold">Data</th>
                      <th className="px-5 py-3 font-semibold">Total</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders2.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {o.id}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {o.customerName}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                        </td>

                        <td className="px-5 py-4 text-slate-900">
                          {money(o.total)}
                        </td>

                        <td className="px-5 py-4">
                          <Badge variant={statusVariant(o.status)}>
                            {o.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}

                    {filteredOrders2.length === 0 && (
                      <tr>
                        <td
                          className="px-5 py-10 text-center text-slate-500"
                          colSpan={5}
                        >
                          Nenhuma venda registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
        </div>

        <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
