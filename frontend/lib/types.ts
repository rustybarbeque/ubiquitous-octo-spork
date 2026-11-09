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

export type UserRole = "Customer" | "Admin";

/** A user as the API returns it (UserDto on the backend). */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  isAdmin: boolean;
  createdAt: string;
}

/** What POST /auth/login and POST /auth/register return. */
export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

/** One product line in the cart, priced live by the API (CartLineDto). */
export interface CartLine {
  itemId: string;
  name: string;
  imageUrl: string;
  category: string;
  regularPrice: number;
  salePrice: number | null;
  /** What is actually being charged per unit. */
  unitPrice: number;
  isOnSale: boolean;
  savingsPerUnit: number;
  quantity: number;
  quantityAvailable: number;
  /** The cart holds more than is in stock; checkout will refuse. */
  exceedsAvailable: boolean;
  lineSubtotal: number;
}

export type DiscountKind = "Percentage" | "FixedAmount";

export type DiscountStatus =
  | "Applied"
  | "Expired"
  | "NotYetActive"
  | "Inactive"
  | "SubtotalTooLow"
  | "NotFound"
  | "None";

/** The applied discount code, re-validated on every read (CartDiscountDto). */
export interface CartDiscount {
  code: string;
  kind: DiscountKind;
  value: number;
  status: DiscountStatus;
  amount: number;
  /** Why the code isn't discounting, when status isn't Applied. */
  message: string | null;
}

/** The whole cart with every total computed server-side (CartDto). */
export interface Cart {
  lines: CartLine[];
  itemCount: number;
  lineCount: number;
  subtotal: number;
  discount: CartDiscount | null;
  discountAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
}

/** The paging envelope every list endpoint returns (PagedResult<T>). */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type OrderStatus = "Pending" | "Paid" | "Shipped" | "Delivered" | "Cancelled";

/** One purchased product, frozen at checkout (OrderLineDto). */
export interface OrderLine {
  id: string;
  /** Null if the product has since been hard-deleted. */
  itemId: string | null;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  regularPrice: number;
  salePrice: number | null;
  unitPrice: number;
  wasOnSale: boolean;
  quantity: number;
  lineSubtotal: number;
}

/** An order as the list endpoints return it (OrderSummaryDto). */
export interface OrderSummary {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  placedAt: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  lineCount: number;
  itemCount: number;
}

/** A full order; every value is frozen at checkout (OrderDto). */
export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  subtotal: number;
  discountCode: string | null;
  discountKind: DiscountKind | null;
  discountValue: number | null;
  discountAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
  itemCount: number;
  lines: OrderLine[];
}

/** A catalog item exactly as the API returns it (ItemDto). */
export interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  price: number;
  salePrice: number | null;
  isOnSale: boolean;
  effectivePrice: number;
  quantityAvailable: number;
  createdAt: string;
}

/** A discount code as administrators see it (DiscountCodeDto). */
export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  kind: DiscountKind;
  /** Percentage points when Percentage (10 = 10% off), dollars when FixedAmount. */
  value: number;
  minimumSubtotal: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  /** Active and inside its date window right now. */
  isCurrentlyValid: boolean;
  createdAt: string;
}
