import { apiFetch } from "@/lib/api-client";
import { Cart } from "@/lib/types";

/*
 * Every cart endpoint returns the whole recalculated cart, so callers just
 * replace their copy with the response. All money is computed by the API.
 */

export function getCart(token: string): Promise<Cart> {
  return apiFetch<Cart>("/cart", { token });
}

/** Adds a product, or increases its quantity if it's already in the cart. */
export function addCartItem(token: string, itemId: string, quantity = 1): Promise<Cart> {
  return apiFetch<Cart>("/cart/items", { method: "POST", body: { itemId, quantity }, token });
}

/** Sets a line's quantity outright (1–1000). Use removeCartItem for zero. */
export function setCartItemQuantity(token: string, itemId: string, quantity: number): Promise<Cart> {
  return apiFetch<Cart>(`/cart/items/${itemId}`, { method: "PUT", body: { quantity }, token });
}

export function removeCartItem(token: string, itemId: string): Promise<Cart> {
  return apiFetch<Cart>(`/cart/items/${itemId}`, { method: "DELETE", token });
}

/** Empties the cart, including any applied discount code. */
export function clearCart(token: string): Promise<Cart> {
  return apiFetch<Cart>("/cart", { method: "DELETE", token });
}

/** Applies a code (case-insensitive). 400 says why it doesn't qualify; 404 if unknown. */
export function applyDiscountCode(token: string, code: string): Promise<Cart> {
  return apiFetch<Cart>("/cart/discount", { method: "POST", body: { code }, token });
}

export function removeDiscountCode(token: string): Promise<Cart> {
  return apiFetch<Cart>("/cart/discount", { method: "DELETE", token });
}
