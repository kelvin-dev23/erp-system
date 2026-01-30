export type ReceivableStatus = "RECEIVED" | "PENDING" | "OVERDUE";

export type Receivable = {
  id: string;
  customer: string;
  description: string;
  dueDate: string; // ISO: "2026-01-30"
  amount: number;
  status: ReceivableStatus;
  createdAt: string;
};
