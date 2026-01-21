import { listCustomers } from "./customersApi";
import { decreaseStock, increaseStock, listProducts } from "./productsApi";



export type OrderStatus = "Pendente" | "Pago" | "Cancelado";

export type OrderItem = {
  productId: string;
  productName: string;
  price: number;
  qty: number;
  total: number;
};

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
  
};

const STORAGE_KEY = "erp_orders_v1";

function seed(): Order[] {
  return [];
}
function randomDateLastDays(days: number) {
  const now = Date.now();
  const diff = Math.floor(Math.random() * days) * 24 * 60 * 60 * 1000;
  return new Date(now - diff).toISOString();
}


function load(): Order[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw) as Order[];
}

function save(items: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function listOrders(search?: string): Promise<Order[]> {
  await delay();
  const items = load();

  const q = search?.trim().toLowerCase();

  const filtered: Order[] = !q
    ? items
    : items.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.status.toLowerCase().includes(q),
      );

 
  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}


export type CreateOrderInput = {
  customerId: string;
  status: OrderStatus;
  items: { productId: string; qty: number }[];
};

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  await delay();

  const customers = await listCustomers();
  const products = await listProducts();

  const customer = customers.find((c) => c.id === input.customerId);
  if (!customer) throw new Error("Cliente inválido");

  if (!input.items.length) throw new Error("Adicione pelo menos 1 item");

  const orderItems: OrderItem[] = input.items.map((i) => {
    const p = products.find((x) => x.id === i.productId);
    if (!p) throw new Error("Produto inválido");

    const qty = Number(i.qty);
    if (qty <= 0) throw new Error("Quantidade inválida");

    const total = p.price * qty;
    

    return {
      productId: p.id,
      productName: p.name,
      price: p.price,
      qty,
      total,
      
    };
  });

  await decreaseStock(input.items);


  const total = orderItems.reduce((acc, it) => acc + it.total, 0);

  const orders = load();
  const newOrder: Order = {
    id: `VND-${String(orders.length + 1).padStart(3, "0")}`,
    customerId: customer.id,
    customerName: customer.name,
    status: input.status,
    items: orderItems,
    total,
    createdAt: randomDateLastDays(30),

  };

  save([newOrder, ...orders]);
  return newOrder;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  await delay();
  const orders = load();

  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) throw new Error("Venda não encontrada");

  const current = orders[idx];

 
  if (status === "Cancelado" && current.status !== "Cancelado") {
    await increaseStock(
      current.items.map((i) => ({ productId: i.productId, qty: i.qty }))
    );
  }

  orders[idx] = { ...current, status };
  save(orders);
}

export async function deleteOrder(id: string): Promise<void> {
  await delay();
  const orders = load();

  const order = orders.find((o) => o.id === id);
  if (!order) return;


  if (order.status !== "Cancelado") {
    await increaseStock(
      order.items.map((i) => ({ productId: i.productId, qty: i.qty }))
    );
  }

  save(orders.filter((o) => o.id !== id));
}
