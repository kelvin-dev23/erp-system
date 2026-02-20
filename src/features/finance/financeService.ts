import { listOrders } from "../../services/ordersApi";
import type { Receivable } from "./types";

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function listReceivables(): Promise<Receivable[]> {
  await wait(300);

  const orders = await listOrders("");

  return orders
    .filter((o) => o.status !== "Cancelado")
    .map((o) => ({
      id: `CR-${o.id}`,
      customer: o.customerName,
      description: `Venda ${o.id}`,
      dueDate: o.createdAt,
      amount: o.total,
      status: o.status === "Pago" ? "RECEIVED" : "PENDING",
      createdAt: o.createdAt,
    }));
}