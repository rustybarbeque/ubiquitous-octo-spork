import type { Metadata } from "next";
import AdminUsers from "@/components/admin/users/AdminUsers";

export const metadata: Metadata = { title: "Users | Admin | Macrocenter" };

export default function AdminUsersPage() {
  return <AdminUsers />;
}
