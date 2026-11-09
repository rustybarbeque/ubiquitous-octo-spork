import { apiFetch } from "@/lib/api-client";
import { toQueryString } from "@/lib/query";
import { DiscountCode, DiscountKind, Item, Order, OrderStatus, OrderSummary, PagedResult, User, UserRole } from "@/lib/types";

/*
 * Reads behind the administrative back end. Every call needs an Admin token.
 * The item, discount-code, user, and order management steps add their writes
 * here as each screen is built.
 */

export type AdminOrderSort =
  | "date-desc"
  | "date-asc"
  | "customer-asc"
  | "customer-desc"
  | "total-desc"
  | "total-asc";

export interface AdminOrderQuery {
  q?: string;
  /** Comma-separated statuses, e.g. "Pending,Paid". */
  status?: string;
  sort?: AdminOrderSort;
  page?: number;
  pageSize?: number;
}

/** Every customer's orders (GET /admin/orders). */
export function getAdminOrders(token: string, query: AdminOrderQuery = {}): Promise<PagedResult<OrderSummary>> {
  return apiFetch(`/admin/orders${toQueryString({ ...query })}`, { token });
}

export interface ItemQuery {
  q?: string;
  category?: string;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

/** The catalog from the browser (GET /items). Public, but used by admin screens. */
export function getItemsPage(query: ItemQuery = {}): Promise<PagedResult<Item>> {
  return apiFetch(`/items${toQueryString({ ...query })}`);
}

export interface ItemInput {
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  price: number;
  /** Null when the item isn't on sale. */
  salePrice: number | null;
  quantityAvailable: number;
}

/** The distinct categories in use, alphabetically (GET /items/categories). */
export function getCategories(): Promise<string[]> {
  return apiFetch("/items/categories");
}

/** Adds a product to the catalog (POST /items). */
export function createItem(token: string, input: ItemInput): Promise<Item> {
  return apiFetch("/items", { method: "POST", body: input, token });
}

/** Replaces every editable field of a product (PUT /items/{id}). */
export function updateItem(token: string, id: string, input: ItemInput): Promise<Item> {
  return apiFetch(`/items/${id}`, { method: "PUT", body: input, token });
}

/**
 * Puts a product on sale, or takes it off sale with null (PUT /items/{id}/sale).
 * Existing carts pick up the change on their next read.
 */
export function setSalePrice(token: string, id: string, salePrice: number | null): Promise<Item> {
  return apiFetch(`/items/${id}/sale`, { method: "PUT", body: { salePrice }, token });
}

/** Sets a product's stock (PUT /items/{id}/inventory). */
export function setInventory(token: string, id: string, quantityAvailable: number): Promise<Item> {
  return apiFetch(`/items/${id}/inventory`, { method: "PUT", body: { quantityAvailable }, token });
}

/**
 * Archives a product (DELETE /items/{id}): it leaves the catalog and every
 * cart, but past orders containing it still read correctly.
 */
export function archiveItem(token: string, id: string): Promise<void> {
  return apiFetch(`/items/${id}`, { method: "DELETE", token });
}

export interface UserQuery {
  q?: string;
  role?: UserRole;
  sort?: string;
  page?: number;
  pageSize?: number;
}

/** All accounts (GET /users). */
export function getUsersPage(token: string, query: UserQuery = {}): Promise<PagedResult<User>> {
  return apiFetch(`/users${toQueryString({ ...query })}`, { token });
}

export interface DiscountCodeQuery {
  q?: string;
  activeOnly?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

/** All discount codes (GET /discount-codes). */
export function getDiscountCodesPage(token: string, query: DiscountCodeQuery = {}): Promise<PagedResult<DiscountCode>> {
  return apiFetch(`/discount-codes${toQueryString({ ...query })}`, { token });
}

export interface DiscountCodeInput {
  /** Letters, digits, hyphens, underscores; the API stores it uppercased. */
  code: string;
  description: string | null;
  kind: DiscountKind;
  /** Percentage points (max 100) or dollars, depending on kind. */
  value: number;
  minimumSubtotal: number | null;
  /** ISO timestamps; null means "already started" / "never expires". */
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

/** Creates a discount code (POST /discount-codes). 409 if the code text is taken. */
export function createDiscountCode(token: string, input: DiscountCodeInput): Promise<DiscountCode> {
  return apiFetch("/discount-codes", { method: "POST", body: input, token });
}

/**
 * Replaces a discount code (PUT /discount-codes/{id}). Carts holding the code
 * are re-priced against the new rules on their next read.
 */
export function updateDiscountCode(token: string, id: string, input: DiscountCodeInput): Promise<DiscountCode> {
  return apiFetch(`/discount-codes/${id}`, { method: "PUT", body: input, token });
}

/** Deletes a code. Carts using it lose the discount; placed orders keep theirs. */
export function deleteDiscountCode(token: string, id: string): Promise<void> {
  return apiFetch(`/discount-codes/${id}`, { method: "DELETE", token });
}

/** The editable fields of an existing code, e.g. to flip isActive and save. */
export function discountCodeInput(code: DiscountCode): DiscountCodeInput {
  return {
    code: code.code,
    description: code.description,
    kind: code.kind,
    value: code.value,
    minimumSubtotal: code.minimumSubtotal,
    startsAt: code.startsAt,
    endsAt: code.endsAt,
    isActive: code.isActive,
  };
}

export interface AdminUserInput {
  email: string;
  firstName: string;
  lastName: string;
  /** Changing this is how an account is promoted or demoted. */
  role: UserRole;
}

/**
 * Updates any account, including its role (PUT /users/{id}). A promoted user
 * must sign in again before the API treats them as an admin.
 * 409 if another account already uses the email.
 */
export function updateUser(token: string, id: string, input: AdminUserInput): Promise<User> {
  return apiFetch(`/users/${id}`, { method: "PUT", body: input, token });
}

/**
 * Deletes an account (DELETE /users/{id}). 409 if the user has placed orders,
 * since order history is never destroyed, or if it's your own account.
 */
export function deleteUser(token: string, id: string): Promise<void> {
  return apiFetch(`/users/${id}`, { method: "DELETE", token });
}

/** Any customer's order in full (GET /admin/orders/{id}). */
export function getAdminOrder(token: string, id: string): Promise<Order> {
  return apiFetch(`/admin/orders/${encodeURIComponent(id)}`, { token });
}

/**
 * Moves an order to any status (PUT /admin/orders/{id}/status). There is no
 * state machine, and cancelling does not return stock to inventory.
 */
export function updateOrderStatus(token: string, id: string, status: OrderStatus): Promise<Order> {
  return apiFetch(`/admin/orders/${id}/status`, { method: "PUT", body: { status }, token });
}
