import type { Metadata } from "next";
import AdminOrders from "@/components/admin/orders/AdminOrders";

export const metadata: Metadata = { title: "Orders | Admin | Macrocenter" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  // ?q= pre-fills the customer search, e.g. from a user's "Orders" button.
  const { q } = await searchParams;
  const initialQuery = (Array.isArray(q) ? q[0] : q) ?? "";
  return <AdminOrders key={initialQuery} initialQuery={initialQuery} />;
}
