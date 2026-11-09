import { OrderStatus } from "@/lib/types";

/** Every status, in the order an order normally moves through them. */
export const ORDER_STATUSES: OrderStatus[] = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"];

/** Orders still being worked on: placed but not yet delivered or cancelled. */
export const CURRENT_STATUSES: OrderStatus[] = ["Pending", "Paid", "Shipped"];

/** Orders that are finished one way or the other. */
export const COMPLETED_STATUSES: OrderStatus[] = ["Delivered", "Cancelled"];
