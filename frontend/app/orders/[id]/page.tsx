import type { Metadata } from "next";
import SiteHeader from "@/components/header/SiteHeader";
import RequireAuth from "@/components/auth/RequireAuth";
import OrderDetails from "@/components/orders/OrderDetails";

export const metadata: Metadata = { title: "Order details | Macrocenter" };

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const { placed } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <RequireAuth>
          <OrderDetails id={id} justPlaced={placed === "1"} />
        </RequireAuth>
      </main>
    </div>
  );
}
