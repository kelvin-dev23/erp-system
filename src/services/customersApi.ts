export type Customer = {
  id: string;
  name: string;
  document: string; 
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
};

const STORAGE_KEY = "erp_customers_v1";

function seed(): Customer[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Ana Silva",
      document: "123.456.789-00",
      email: "ana@email.com",
      phone: "(11) 99999-1111",
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: "João Pedro",
      document: "987.654.321-00",
      email: "joao@email.com",
      phone: "(21) 98888-2222",
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function load(): Customer[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw) as Customer[];
}

function save(items: Customer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function listCustomers(search?: string): Promise<Customer[]> {
  await delay();
  const items = load();

  if (!search?.trim()) return items;

  const q = search.toLowerCase();
  return items.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.document.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
  );
}

export type UpsertCustomerInput = {
  id?: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  active: boolean;
};

export async function createCustomer(input: UpsertCustomerInput): Promise<Customer> {
  await delay();
  const items = load();

  const newItem: Customer = {
    id: crypto.randomUUID(),
    name: input.name,
    document: input.document,
    email: input.email,
    phone: input.phone,
    active: input.active,
    createdAt: new Date().toISOString(),
  };

  save([newItem, ...items]);
  return newItem;
}

export async function updateCustomer(input: UpsertCustomerInput): Promise<Customer> {
  await delay();
  const items = load();
  const idx = items.findIndex((c) => c.id === input.id);

  if (idx === -1) throw new Error("Cliente não encontrado");

  const updated: Customer = {
    ...items[idx],
    name: input.name,
    document: input.document,
    email: input.email,
    phone: input.phone,
    active: input.active,
  };

  items[idx] = updated;
  save(items);
  return updated;
}

export async function deleteCustomer(id: string): Promise<void> {
  await delay();
  const items = load();
  save(items.filter((c) => c.id !== id));
}
