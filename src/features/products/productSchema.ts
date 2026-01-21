import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Nome precisa ter no mínimo 2 caracteres"),
  sku: z.string().min(2, "SKU precisa ter no mínimo 2 caracteres"),
  price: z.coerce.number().min(0, "Preço não pode ser negativo"),
  stock: z.coerce.number().int("Estoque deve ser inteiro").min(0, "Estoque não pode ser negativo"),
  active: z.coerce.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
