export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  salePrice: number | null;
  quantityAvailable: number;
  category: string;
}

export type SortOption = "relevance" | "price-asc" | "price-desc" | "availability-desc" | "availability-asc";
