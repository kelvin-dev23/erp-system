export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  active: boolean;
  createdAt: string;
};

const STORAGE_KEY = "erp_products_v1";

function seed(): Product[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Teclado Mecânico",
      sku: "TEC-001",
      price: 199.9,
      stock: 12,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: "Mouse Gamer",
      sku: "MOU-010",
      price: 129.9,
      stock: 25,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function load(): Product[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw) as Product[];
}

function save(items: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function delay(ms = 350) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function listProducts(search?: string): Promise<Product[]> {
  await delay();
  const items = load();

  if (!search?.trim()) return items;

  const q = search.toLowerCase();
  return items.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  );
}

export type UpsertProductInput = {
  id?: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  active: boolean;
};

export async function createProduct(input: UpsertProductInput): Promise<Product> {
  await delay();
  const items = load();

  const newItem: Product = {
    id: crypto.randomUUID(),
    name: input.name,
    sku: input.sku,
    price: input.price,
    stock: input.stock,
    active: input.active,
    createdAt: new Date().toISOString(),
  };

  save([newItem, ...items]);
  return newItem;
}

export async function updateProduct(input: UpsertProductInput): Promise<Product> {
  await delay();
  const items = load();
  const idx = items.findIndex((p) => p.id === input.id);

  if (idx === -1) throw new Error("Produto não encontrado");

  const updated: Product = {
    ...items[idx],
    name: input.name,
    sku: input.sku,
    price: input.price,
    stock: input.stock,
    active: input.active,
  };

  items[idx] = updated;
  save(items);
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  await delay();
  const items = load();
  save(items.filter((p) => p.id !== id));
}

export async function decreaseStock(items: { productId: string; qty: number }[]) {
  const products = load();


  for (const it of items) {
    const p = products.find((x) => x.id === it.productId);
    if (!p) throw new Error("Produto inválido");

    const qty = Number(it.qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`Quantidade inválida para ${p.name}`);
    }

    if (!p.active) {
      throw new Error(`Produto inativo: ${p.name}`);
    }

    if (p.stock < qty) {
      throw new Error(`Estoque insuficiente: ${p.name} (disp: ${p.stock})`);
    }
  }
  

 
  const updated = products.map((p) => {
    const it = items.find((x) => x.productId === p.id);
    if (!it) return p;

    const qty = Number(it.qty);
    return { ...p, stock: p.stock - qty }; 
  });

  save(updated);
}

export async function increaseStock(
  items: { productId: string; qty: number }[]
): Promise<void> {
  await delay();

  const products = load();

  for (const it of items) {
    const idx = products.findIndex((p) => p.id === it.productId);
    if (idx === -1) continue;

    const q = Number(it.qty) || 0;
    if (q <= 0) continue;

    products[idx] = {
      ...products[idx],
      stock: products[idx].stock + q,
    };
  }

  save(products);
}
