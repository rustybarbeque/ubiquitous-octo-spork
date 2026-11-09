import type { Metadata } from "next";
import AdminOrderDetails from "@/components/admin/orders/AdminOrderDetails";

export const metadata: Metadata = { title: "Order details | Admin | Macrocenter" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  return <AdminOrderDetails id={id} />;
}
