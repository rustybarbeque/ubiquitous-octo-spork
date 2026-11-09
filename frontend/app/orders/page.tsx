import type { Metadata } from "next";
import SiteHeader from "@/components/header/SiteHeader";
import RequireAuth from "@/components/auth/RequireAuth";
import OrderHistory from "@/components/orders/OrderHistory";

export const metadata: Metadata = { title: "Order history | Macrocenter" };

export default function OrdersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <RequireAuth>
          <OrderHistory />
        </RequireAuth>
      </main>
    </div>
  );
}
