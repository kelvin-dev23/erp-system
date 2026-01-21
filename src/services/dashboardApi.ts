import { listCustomers } from "./customersApi";
import { listOrders } from "./ordersApi";
import { listProducts } from "./productsApi";

function delay(ms = 250) {
  return new Promise((r) => setTimeout(r, ms));
}

export type SalesPoint = { day: string; total: number };

export type DashboardData = {
  totalProducts: number;
  totalCustomers: number;
  totalSales: number;
  revenue: number;
  salesChart: SalesPoint[];
  lastSales: { id: string; customer: string; total: number; status: string }[];
};

function dayLabel(d: Date) {
  
  const map = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return map[d.getDay()];
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getDashboard(): Promise<DashboardData> {
  await delay();

  const [products, customers, orders] = await Promise.all([
    listProducts(""),
    listCustomers(""),
    listOrders(""),
  ]);

  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalSales = orders.length;

  
  const revenue = orders
    .filter((o) => o.status === "Pago")
    .reduce((acc, o) => acc + o.total, 0);

 
  const today = startOfDay(new Date());
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  const salesChart: SalesPoint[] = days.map((d) => {
    const from = startOfDay(d).getTime();
    const to = new Date(d);
    to.setHours(23, 59, 59, 999);

    const total = orders
      .filter((o) => o.status === "Pago")
      .filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= from && t <= to.getTime();
      })
      .reduce((acc, o) => acc + o.total, 0);

    return { day: dayLabel(d), total };
  });

 
  const lastSales = orders.slice(0, 4).map((o) => ({
    id: o.id,
    customer: o.customerName,
    total: o.total,
    status: o.status,
  }));

  return {
    totalProducts,
    totalCustomers,
    totalSales,
    revenue,
    salesChart,
    lastSales,
  };
}
