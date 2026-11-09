import { connection } from "next/server";
import { Item, PagedResult, Product } from "@/lib/types";

/**
 * Base URL for server-side calls to the API. Inside Docker Compose this is
 * API_URL (http://api:8080, the Compose network address). When running
 * `npm run dev` on the host, it falls back to the browser-facing URL.
 */
const API_BASE_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/** The largest page size the API serves (PagedQuery.MaxPageSize). */
const PAGE_SIZE = 100;

function toProduct(item: Item): Product {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    price: item.price,
    salePrice: item.salePrice,
    quantityAvailable: item.quantityAvailable,
    category: item.category,
  };
}

async function fetchItemsPage(page: number): Promise<PagedResult<Item>> {
  const url = `${API_BASE_URL}/items?page=${page}&pageSize=${PAGE_SIZE}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Every product in the catalog, read from the API. Walks all pages so the
 * storefront's client-side search and sort see the full catalog.
 */
export async function getProducts(): Promise<Product[]> {
  // Render at request time, not during `next build`: the API isn't reachable
  // while the Docker image is being built, and stock/prices change live.
  await connection();

  const first = await fetchItemsPage(1);
  const items = [...first.items];

  for (let page = 2; page <= first.totalPages; page++) {
    const next = await fetchItemsPage(page);
    items.push(...next.items);
  }

  return items.map(toProduct);
}
