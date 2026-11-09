import { apiFetch } from "@/lib/api-client";
import { toQueryString } from "@/lib/query";
import { Order, OrderSummary, PagedResult } from "@/lib/types";

export type MyOrdersSort = "newest" | "oldest" | "total-desc" | "total-asc";

export interface MyOrdersQuery {
  page?: number;
  pageSize?: number;
  sort?: MyOrdersSort;
}

/**
 * Turns the signed-in user's cart into an order (POST /orders), freezing every
 * price and emptying the cart. 400 if the cart is empty or stock ran out.
 */
export function placeOrder(token: string): Promise<Order> {
  return apiFetch<Order>("/orders", { method: "POST", token });
}

/** The signed-in user's own order history (GET /orders). */
export function getMyOrders(token: string, query: MyOrdersQuery = {}): Promise<PagedResult<OrderSummary>> {
  return apiFetch<PagedResult<OrderSummary>>(`/orders${toQueryString({ ...query })}`, { token });
}

/** One order in full. 403 if it belongs to someone else, 404 if it doesn't exist. */
export function getOrder(token: string, id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${encodeURIComponent(id)}`, { token });
}
