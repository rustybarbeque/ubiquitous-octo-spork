import type { Metadata } from "next";
import AdminItems from "@/components/admin/items/AdminItems";

export const metadata: Metadata = { title: "Items | Admin | Macrocenter" };

export default function AdminItemsPage() {
  return <AdminItems />;
}
