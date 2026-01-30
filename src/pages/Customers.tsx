import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ActionsMenu } from "../ui/ActionsMenu";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { TableSkeleton } from "../ui/TableSkeleton";
import { useToast } from "../ui/useToast";

import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from "../services/customersApi";

import type { Customer, UpsertCustomerInput } from "../services/customersApi";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Input } from "../ui/Input";

export function Customers() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => listCustomers(search),
  });

  const createMut = useMutation({
    mutationFn: createCustomer,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Cliente criado",
        message: "Cliente cadastrado com sucesso.",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar",
        message: "Não foi possível cadastrar o cliente. Tente novamente.",
        variant: "error",
      });
    },
  });

  const updateMut = useMutation({
    mutationFn: updateCustomer,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Cliente atualizado",
        message: "Alterações salvas com sucesso.",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        message: "Não foi possível salvar as alterações.",
        variant: "error",
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Cliente excluído",
        message: "Registro removido com sucesso.",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        message: "Não foi possível remover o cliente.",
        variant: "error",
      });
    },
  });

  const items = useMemo(() => data ?? [], [data]);

  function startCreate() {
    setEditing({
      id: "",
      name: "",
      document: "",
      email: "",
      phone: "",
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  function startEdit(c: Customer) {
    setEditing(c);
  }

  function closeForm() {
    setEditing(null);
  }

  async function handleSubmit(input: UpsertCustomerInput) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">👤 Clientes</h1>
          <p className="text-sm text-slate-500">
            Gerencie clientes, documentos e contatos.
          </p>
        </div>

        <div className="sm:ml-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="w-full sm:w-[340px]">
            <Input
              placeholder="Buscar por nome, doc ou email..."
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
            + Novo cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Lista de clientes"
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
                    <th className="px-5 py-3 font-semibold">Nome</th>
                    <th className="px-5 py-3 font-semibold">Documento</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Telefone</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold w-[170px]">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          title="Nenhum cliente encontrado"
                          description="Tente ajustar a busca ou cadastre um novo cliente."
                          actionLabel="+ Novo cliente"
                          onAction={startCreate}
                        />
                      </td>
                    </tr>
                  ) : (
                    items.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {c.name}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {c.document}
                        </td>

                        <td className="px-5 py-4 text-slate-600">{c.email}</td>

                        <td className="px-5 py-4 text-slate-600">{c.phone}</td>

                        <td className="px-5 py-4">
                          <Badge variant={c.active ? "success" : "danger"}>
                            {c.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => startEdit(c)}
                            >
                              Editar
                            </Button>

                            <ActionsMenu
                              actions={[
                                {
                                  label: "Editar",
                                  onClick: () => startEdit(c),
                                },
                                {
                                  label: "Excluir",
                                  danger: true,
                                  onClick: () => handleDelete(c.id),
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
        <CustomerForm
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

/** FORM */

const customerSchema = z.object({
  name: z.string().min(2, "Nome precisa ter pelo menos 2 caracteres"),
  document: z.string().min(5, "Documento inválido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Telefone inválido"),
  active: z.boolean(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

function CustomerForm({
  initial,
  onClose,
  onSubmit,
  loading,
}: {
  initial: Customer;
  onClose: () => void;
  onSubmit: (input: UpsertCustomerInput) => void | Promise<void>;
  loading: boolean;
}) {
  const isEdit = Boolean(initial.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initial.name || "",
      document: initial.document || "",
      email: initial.email || "",
      phone: initial.phone || "",
      active: initial.active ?? true,
    },
  });

  function submit(values: CustomerFormValues) {
    onSubmit({
      name: values.name.trim(),
      document: values.document.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
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
        className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isEdit ? "Editar cliente" : "Novo cliente"}
            </h2>
            <p className="text-sm text-slate-500">
              Preencha os dados do cliente abaixo.
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Fechar
          </Button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="grid gap-4 p-5">
          <Input
            label="Nome"
            placeholder="Ex: Ana Silva"
            {...register("name")}
            error={errors.name?.message}
          />

          <Input
            label="Documento (CPF/CNPJ)"
            placeholder="Ex: 000.000.000-00"
            {...register("document")}
            error={errors.document?.message}
          />

          <Input
            label="Email"
            placeholder="Ex: ana@email.com"
            {...register("email")}
            error={errors.email?.message}
          />

          <Input
            label="Telefone"
            placeholder="Ex: (11) 99999-9999"
            {...register("phone")}
            error={errors.phone?.message}
          />

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              {...register("active", { setValueAs: (v) => Boolean(v) })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Cliente ativo
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
