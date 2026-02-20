import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ActionsMenu } from "../ui/ActionsMenu";
import { Breadcrumb } from "../ui/Breadcrumb";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { TableSkeleton } from "../ui/TableSkeleton";

import {
  createOrder,
  deleteOrder,
  listOrders,
  updateOrderStatus,
  type OrderStatus,
} from "../services/ordersApi";

import { listCustomers, type Customer } from "../services/customersApi";
import { listProducts, type Product } from "../services/productsApi";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Input } from "../ui/Input";
import { useToast } from "../ui/useToast";

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function statusBadgeVariant(status: OrderStatus) {
  if (status === "Pago") return "success";
  if (status === "Cancelado") return "danger";
  return "warning";
}

export function Orders() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState<{
    id: string;
    items: { productName: string; qty: number }[];
  } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["orders", search],
    queryFn: () => listOrders(search),
  });

  const items = useMemo(() => data ?? [], [data]);

  const createMut = useMutation({
    mutationFn: createOrder,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["orders"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);

      toast({
        variant: "success",
        title: "Venda criada",
        message: "A venda foi registrada com sucesso.",
      });
    },
    onError: (e) => {
      toast({
        variant: "error",
        title: "Erro ao criar venda",
        message: (e as Error).message,
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteOrder,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["orders"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });

      toast({
        variant: "info",
        title: "Venda removida",
        message: "A venda foi excluída com sucesso.",
      });
    },
    onError: (e) => {
      toast({
        variant: "error",
        title: "Erro ao excluir venda",
        message: (e as Error).message,
      });
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),

    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ["orders"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });

      toast({
        variant:
          vars.status === "Pago"
            ? "success"
            : vars.status === "Cancelado"
              ? "warning"
              : "info",
        title: "Status atualizado",
        message: `Venda marcada como: ${vars.status}.`,
      });
    },

    onError: (e) => {
      toast({
        variant: "error",
        title: "Erro ao atualizar status",
        message: (e as Error).message,
      });
    },
  });

  function handleDelete(id: string) {
    setDeleteId(id);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <Breadcrumb items={[{ label: "Dashboard" }, { label: "Vendas" }]} />

          <h1 className="text-xl font-semibold text-slate-900">🧾 Vendas</h1>
          <p className="text-sm text-slate-500">
            Registre vendas e acompanhe status e itens.
          </p>
        </div>

        <div className="sm:ml-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="w-full sm:w-[360px]">
            <Input
              placeholder="Buscar por id, cliente ou status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ConfirmDialog
              open={Boolean(deleteId)}
              title="Excluir cliente?"
              message="Essa ação não pode ser desfeita."
              confirmLabel="Excluir"
              cancelLabel="Cancelar"
              loading={deleteMut.isPending}
              onClose={() => setDeleteId(null)}
              onConfirm={async () => {
                if (!deleteId) return;
                await deleteMut.mutateAsync(deleteId);
                setDeleteId(null);
              }}
            />
          </div>

          <Button onClick={() => setOpen(true)} className="whitespace-nowrap">
            + Nova venda
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Lista de vendas"
          subtitle={`${items.length} item(ns)`}
          right={
            <div className="text-xs text-slate-500">
              {isLoading ? "Carregando..." : "Atualizado"}
            </div>
          }
        />

        <CardContent className="p-0">
          {isLoading && (
            <table className="w-full">
              <TableSkeleton rows={5} cols={6} />
            </table>
          )}

          {isError && (
            <div className="p-5 text-sm text-rose-600">
              Erro: {(error as Error)?.message}
            </div>
          )}

          {!isLoading && !isError && (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Id</th>
                    <th className="px-5 py-3 font-semibold">Cliente</th>
                    <th className="px-5 py-3 font-semibold">Total</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold w-[240px]">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          title="Nenhuma venda encontrada"
                          description="Tente ajustar a busca ou cadastre uma nova venda."
                          actionLabel="+ Nova venda"
                          onAction={() => setOpen(true)}
                        />
                      </td>
                    </tr>
                  ) : (
                    items.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {o.id}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {o.customerName}
                        </td>

                        <td className="px-5 py-4 text-slate-900">
                          {money(o.total)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Badge variant={statusBadgeVariant(o.status)}>
                              {o.status}
                            </Badge>

                            <select
                              value={o.status}
                              onChange={(e) =>
                                statusMut.mutate({
                                  id: o.id,
                                  status: e.target.value as OrderStatus,
                                })
                              }
                              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Pago">Pago</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setItemsOpen({ id: o.id, items: o.items })
                              }
                            >
                              Ver itens
                            </Button>

                            <ActionsMenu
                              actions={[
                                {
                                  label: "Excluir",
                                  danger: true,
                                  onClick: () => handleDelete(o.id),
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {open && (
        <OrderModal
          onClose={() => setOpen(false)}
          onCreate={async (data) => {
            await createMut.mutateAsync(data);
          }}
          loading={createMut.isPending}
        />
      )}

      {itemsOpen && (
        <ItemsModal
          title={`Itens da venda ${itemsOpen.id}`}
          items={itemsOpen.items}
          onClose={() => setItemsOpen(null)}
        />
      )}
    </div>
  );
}

function ItemsModal({
  title,
  items,
  onClose,
}: {
  title: string;
  items: { productName: string; qty: number }[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">Produtos e quantidades.</p>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Fechar
          </Button>
        </div>

        <div className="grid gap-2 p-5">
          {items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Nenhum item registrado.
            </div>
          ) : (
            items.map((i, idx) => (
              <div
                key={`${i.productName}-${idx}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="font-semibold text-slate-900">
                  {i.productName}
                </div>
                <div className="text-sm text-slate-700">x{i.qty}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function OrderModal({
  onClose,
  onCreate,
  loading,
}: {
  onClose: () => void;
  onCreate: (data: {
    customerId: string;
    status: OrderStatus;
    items: { productId: string; qty: number }[];
  }) => Promise<void>;
  loading: boolean;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState<OrderStatus>("Pendente");

  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);

  const [cart, setCart] = useState<{ productId: string; qty: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    listCustomers().then(setCustomers);
    listProducts().then(setProducts);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const cartTotal = cart.reduce((acc, item) => {
    const p = products.find((x) => x.id === item.productId);
    if (!p) return acc;
    return acc + p.price * item.qty;
  }, 0);

  const selectedProduct = products.find((p) => p.id === productId);
  const isUnavailable =
    !!selectedProduct &&
    (!selectedProduct.active || selectedProduct.stock === 0);
  const availableStock = selectedProduct?.stock ?? 0;

  function addItem() {
    setFormError(null);

    if (!productId) return;
    const p = products.find((x) => x.id === productId);
    if (!p) return;

    if (!p.active || p.stock === 0) {
      setFormError("Produto indisponível (inativo ou sem estoque).");
      return;
    }

    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) {
      setFormError("Quantidade inválida.");
      return;
    }

    setCart((prev) => {
      const already = prev.find((i) => i.productId === productId)?.qty ?? 0;
      const nextQty = already + q;

      if (nextQty > p.stock) {
        setFormError(
          `Estoque insuficiente: ${p.name} (disp: ${p.stock}, no carrinho: ${already})`,
        );
        return prev;
      }

      const exists = prev.find((i) => i.productId === productId);
      if (exists) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: nextQty } : i,
        );
      }

      return [...prev, { productId, qty: q }];
    });

    setProductId("");
    setQty(1);
  }

  function removeItem(pid: string) {
    setCart((prev) => prev.filter((i) => i.productId !== pid));
  }

  async function submit() {
    setFormError(null);

    try {
      await onCreate({
        customerId,
        status,
        items: cart,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar venda";
      setFormError(msg);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[760px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Nova venda
            </h2>
            <p className="text-sm text-slate-500">
              Selecione cliente, status e itens.
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Fechar
          </Button>
        </div>

        <div className="grid gap-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-800">
                Cliente
              </span>

              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">
                Status
              </span>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4 sm:items-end">
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-800">
                Produto
              </span>

              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setQty(1);
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione...</option>

                {products.map((p) => {
                  const disabled = !p.active || p.stock === 0;
                  const inCart =
                    cart.find((i) => i.productId === p.id)?.qty ?? 0;

                  return (
                    <option key={p.id} value={p.id} disabled={disabled}>
                      {p.name} ({money(p.price)}) — estoque: {p.stock} — no
                      carrinho: {inCart}
                      {disabled ? " (indisponível)" : ""}
                    </option>
                  );
                })}
              </select>

              {selectedProduct && (
                <div className="text-xs font-semibold text-slate-500">
                  Estoque disponível: {selectedProduct.stock}
                </div>
              )}

              {isUnavailable && (
                <div className="text-xs font-extrabold text-rose-700">
                  Produto indisponível (inativo ou sem estoque).
                </div>
              )}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">Qtd</span>

              <input
                type="number"
                min={1}
                max={selectedProduct ? availableStock : undefined}
                value={qty}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;

                  if (selectedProduct) {
                    const clamped = Math.min(Math.max(1, v), availableStock);
                    setQty(clamped);
                  } else {
                    setQty(Math.max(1, v));
                  }
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <Button
              onClick={addItem}
              type="button"
              disabled={!productId || isUnavailable}
              className="h-11 w-full"
            >
              + Adicionar
            </Button>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-slate-900">Itens</strong>
              <span className="text-xs text-slate-500">
                {cart.length} item(ns)
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Nenhum item adicionado.
              </div>
            ) : (
              <div className="grid gap-2">
                {cart.map((i) => {
                  const p = products.find((x) => x.id === i.productId);
                  if (!p) return null;

                  const atLimit = i.qty >= p.stock;

                  return (
                    <div
                      key={i.productId}
                      className={[
                        "flex items-center justify-between gap-3 rounded-xl border p-3",
                        atLimit
                          ? "border-amber-200 bg-amber-50"
                          : "border-slate-200 bg-white",
                      ].join(" ")}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {i.qty} x {money(p.price)} — estoque disp: {p.stock}
                          {atLimit ? " (limite atingido)" : ""}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <strong className="text-sm text-slate-900">
                          {money(p.price * i.qty)}
                        </strong>

                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeItem(i.productId)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {formError}
            </div>
          )}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <strong className="text-slate-900">
              Total: {money(cartTotal)}
            </strong>

            <div className="flex items-center gap-2">
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancelar
              </Button>

              <Button
                disabled={loading || !customerId || cart.length === 0}
                onClick={submit}
              >
                {loading ? "Salvando..." : "Finalizar venda"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
