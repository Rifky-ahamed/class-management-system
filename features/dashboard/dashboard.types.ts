interface Order {
  id: string;
  created_at: string;
  total: number;
  status: "paid" | "pending" | "shipped" | "cancelled" | string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  stock: number;
}
export type { Order, Product };
