import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ActionsMenu } from "../ui/ActionsMenu";
import { Breadcrumb } from "../ui/Breadcrumb";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { TableSkeleton } from "../ui/TableSkeleton";
import { useToast } from "../ui/useToast";

import { useForm } from "react-hook-form";
import { z } from "zod";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "../services/productsApi";

import type { Product, UpsertProductInput } from "../services/productsApi";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Input } from "../ui/Input";

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function isAlertStock(p: Product) {
  return p.stock === 0 || (p.stock > 0 && p.stock <= 5);
}

function rowClass(p: Product) {
  if (p.stock === 0) return "bg-rose-50 hover:bg-rose-100/50";
  if (p.stock > 0 && p.stock <= 5) return "bg-amber-50 hover:bg-amber-100/50";
  return "hover:bg-slate-50/60";
}

export function Products() {
  const qc = useQueryClient();
  const location = useLocation();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [onlyAlerts, setOnlyAlerts] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("alerts") === "1";
  });

  useMemo(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("alerts") !== "1") return null;

    params.delete("alerts");
    const next = params.toString();
    const newUrl = next ? `${location.pathname}?${next}` : location.pathname;

    window.history.replaceState({}, "", newUrl);
    return null;
  }, [location.pathname, location.search]);

  const [editing, setEditing] = useState<Product | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products", search],
    queryFn: () => listProducts(search),
  });

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["products"] });
      toast({
        variant: "success",
        title: "Produto criado",
        message: "Salvo com sucesso!",
      });
    },
    onError: (e) => {
      toast({ variant: "error", title: "Erro", message: (e as Error).message });
    },
  });

  const updateMut = useMutation({
    mutationFn: updateProduct,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
      toast({
        variant: "success",
        title: "Produto atualizado",
        message: "Alterações salvas!",
      });
    },
    onError: (e) => {
      toast({ variant: "error", title: "Erro", message: (e as Error).message });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["products"] });
      toast({
        variant: "success",
        title: "Produto removido",
        message: "Excluído com sucesso!",
      });
    },
    onError: (e) => {
      toast({ variant: "error", title: "Erro", message: (e as Error).message });
    },
  });

  const items = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const out = items.filter((p) => p.stock === 0).length;
    const low = items.filter((p) => p.stock > 0 && p.stock <= 5).length;
    return { total: items.length, out, low };
  }, [items]);

  const filtered = useMemo(() => {
    if (!onlyAlerts) return items;
    return items.filter(isAlertStock);
  }, [items, onlyAlerts]);

  function startCreate() {
    setEditing({
      id: "",
      name: "",
      sku: "",
      price: 0,
      stock: 0,
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  function startEdit(p: Product) {
    setEditing(p);
  }

  function closeForm() {
    setEditing(null);
  }

  async function handleSubmit(input: UpsertProductInput) {
    if (editing?.id) {
      await updateMut.mutateAsync({ ...input, id: editing.id });
    } else {
      await createMut.mutateAsync(input);
      setEditing(null);
    }
  }

  function handleDelete(id: string) {
    setDeleteId(id);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <Breadcrumb items={[{ label: "Dashboard" }, { label: "Produtos" }]} />

          <h1 className="text-xl font-semibold text-slate-900">📦 Produtos</h1>
          <p className="text-sm text-slate-500">
            Cadastre e gerencie seus produtos e estoque.
          </p>
        </div>

        <div className="sm:ml-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="w-full sm:w-[320px]">
            <Input
              placeholder="Buscar por nome ou SKU..."
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

          <Button onClick={startCreate} className="whitespace-nowrap">
            + Novo produto
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">
            Total: <span className="text-slate-900">{stats.total}</span>
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            Sem estoque: <span className="text-rose-900">{stats.out}</span>
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Baixo: <span className="text-amber-900">{stats.low}</span>
          </span>
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={onlyAlerts}
            onChange={(e) => setOnlyAlerts(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Somente alertas de estoque
        </label>
      </div>

      <Card>
        <CardHeader
          title="Lista de produtos"
          subtitle={`${filtered.length} item(ns)`}
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
                    <th className="px-5 py-3 font-semibold">Nome</th>
                    <th className="px-5 py-3 font-semibold">SKU</th>
                    <th className="px-5 py-3 font-semibold">Preço</th>
                    <th className="px-5 py-3 font-semibold">Estoque</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold w-[170px]">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          title="Nenhum produto encontrado"
                          description="Tente ajustar a busca ou cadastre um novo produto."
                          actionLabel="+ Novo produto"
                          onAction={startCreate}
                        />
                      </td>
                    </tr>
                  ) : (
                    items.map((p) => (
                      <tr key={p.id} className={rowClass(p)}>
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {p.name}
                        </td>

                        <td className="px-5 py-4 text-slate-600">{p.sku}</td>

                        <td className="px-5 py-4 text-slate-900">
                          {money(p.price)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {p.stock}
                            </span>

                            {p.stock === 0 && (
                              <Badge variant="danger">Sem estoque</Badge>
                            )}

                            {p.stock > 0 && p.stock <= 5 && (
                              <Badge variant="warning">Baixo</Badge>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <Badge variant={p.active ? "success" : "danger"}>
                            {p.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => startEdit(p)}
                            >
                              Editar
                            </Button>

                            <ActionsMenu
                              actions={[
                                {
                                  label: "Editar",
                                  onClick: () => startEdit(p),
                                },
                                {
                                  label: "Excluir",
                                  danger: true,
                                  onClick: () => handleDelete(p.id),
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

      {editing && (
        <ProductForm
          key={editing.id || "new"}
          initial={editing}
          onClose={closeForm}
          onSubmit={handleSubmit}
          loading={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

const productSchema = z.object({
  name: z.string().min(2, "Nome precisa ter pelo menos 2 caracteres"),
  sku: z.string().min(2, "SKU precisa ter pelo menos 2 caracteres"),
  price: z.number().min(0, "Preço não pode ser negativo"),
  stock: z
    .number()
    .int("Estoque deve ser inteiro")
    .min(0, "Estoque não pode ser negativo"),
  active: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

function ProductForm({
  initial,
  onClose,
  onSubmit,
  loading,
}: {
  initial: Product;
  onClose: () => void;
  onSubmit: (input: UpsertProductInput) => void | Promise<void>;
  loading: boolean;
}) {
  const isEdit = Boolean(initial.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initial.name || "",
      sku: initial.sku || "",
      price: initial.price ?? 0,
      stock: initial.stock ?? 0,
      active: initial.active ?? true,
    },
  });

  function submit(values: ProductFormValues) {
    onSubmit({
      name: values.name.trim(),
      sku: values.sku.trim(),
      price: values.price,
      stock: values.stock,
      active: values.active,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isEdit ? "Editar produto" : "Novo produto"}
            </h2>
            <p className="text-sm text-slate-500">
              Preencha os dados do produto abaixo.
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Fechar
          </Button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="grid gap-4 p-5">
          <Input
            label="Nome"
            placeholder="Ex: Teclado Mecânico"
            {...register("name")}
            error={errors.name?.message}
          />

          <Input
            label="SKU"
            placeholder="Ex: TEC-001"
            {...register("sku")}
            error={errors.sku?.message}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Preço"
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              error={errors.price?.message}
            />

            <Input
              label="Estoque"
              type="number"
              {...register("stock", { valueAsNumber: true })}
              error={errors.stock?.message}
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              {...register("active", { setValueAs: (v) => Boolean(v) })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Produto ativo
          </label>

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>

            <Button type="submit" loading={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
