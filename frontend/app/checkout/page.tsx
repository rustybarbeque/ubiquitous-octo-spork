import type { Metadata } from "next";
import SiteHeader from "@/components/header/SiteHeader";
import RequireAuth from "@/components/auth/RequireAuth";
import Checkout from "@/components/orders/Checkout";

export const metadata: Metadata = { title: "Checkout | Macrocenter" };

export default function CheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <RequireAuth>
          <Checkout />
        </RequireAuth>
      </main>
    </div>
  );
}
