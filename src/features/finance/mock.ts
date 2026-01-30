import { type Receivable } from "./types";

export const receivablesMock: Receivable[] = [
  {
    id: "CR-001",
    customer: "Ana Silva",
    description: "Venda VND-001",
    dueDate: "2026-02-10",
    amount: 320.5,
    status: "RECEIVED",
    createdAt: "2026-01-10",
  },
  {
    id: "CR-002",
    customer: "João Pedro",
    description: "Venda VND-002",
    dueDate: "2026-02-15",
    amount: 199.9,
    status: "PENDING",
    createdAt: "2026-01-12",
  },
  {
    id: "CR-003",
    customer: "Mercado Central",
    description: "Venda VND-004",
    dueDate: "2026-01-20",
    amount: 980.0,
    status: "OVERDUE",
    createdAt: "2026-01-05",
  },
];
