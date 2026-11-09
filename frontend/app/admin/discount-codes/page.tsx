import type { Metadata } from "next";
import AdminDiscountCodes from "@/components/admin/discounts/AdminDiscountCodes";

export const metadata: Metadata = { title: "Discount codes | Admin | Macrocenter" };

export default function AdminDiscountCodesPage() {
  return <AdminDiscountCodes />;
}
