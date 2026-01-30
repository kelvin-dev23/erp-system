import { useEffect, useMemo, useState } from "react";
import { listReceivables } from "../features/finance/financeService";
import type { Receivable } from "../features/finance/types";
import { ActionsMenu } from "../ui/ActionsMenu";
import { Breadcrumb } from "../ui/Breadcrumb";
import { Card, CardContent } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { TableSkeleton } from "../ui/TableSkeleton";

import { Badge } from "../ui/Badge";

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function Finance() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Receivable[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await listReceivables();
      const order = { OVERDUE: 0, PENDING: 1, RECEIVED: 2 } as const;

      data.sort((a, b) => order[a.status] - order[b.status]);
      setItems(data);

      setItems(data);
      setLoading(false);
    })();
  }, []);

  const totals = useMemo(() => {
    const received = items
      .filter((i) => i.status === "RECEIVED")
      .reduce((acc, i) => acc + i.amount, 0);

    const pending = items
      .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
      .reduce((acc, i) => acc + i.amount, 0);

    return { received, pending };
  }, [items]);

  function handleDelete(id: string) {
    setDeleteId(id);
  }

  function removeLocal(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Dashboard" }, { label: "Financeiro" }]} />

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Financeiro</h1>
        <p className="text-sm text-slate-500">Contas a receber e status.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Total recebido</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatMoney(totals.received)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Total pendente</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatMoney(totals.pending)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr className="text-left text-sm text-slate-500">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Venc.</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton rows={5} cols={7} />
            ) : (
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title="Nenhuma conta a receber"
                        description="Quando você registrar vendas a prazo, elas aparecem aqui."
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 text-sm"
                    >
                      <td className="px-5 py-4">{r.id}</td>
                      <td className="px-5 py-4">{r.customer}</td>
                      <td className="px-5 py-4">{r.description}</td>
                      <td className="px-5 py-4">
                        {new Date(r.dueDate).toLocaleDateString("pt-BR")}
                      </td>

                      <td className="px-5 py-4">{formatMoney(r.amount)}</td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            r.status === "RECEIVED"
                              ? "success"
                              : r.status === "OVERDUE"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {r.status === "RECEIVED"
                            ? "Recebido"
                            : r.status === "OVERDUE"
                              ? "Vencido"
                              : "Pendente"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ActionsMenu
                          actions={[
                            {
                              label: "Excluir",
                              danger: true,
                              onClick: () => handleDelete(r.id),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir conta a receber?"
        message="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          removeLocal(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
