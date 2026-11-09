"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Spin } from "antd";
import { Lock, ShoppingCart } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import CartSummary from "@/components/cart/CartSummary";
import DiscountCodeForm from "@/components/cart/DiscountCodeForm";
import LineItemRow from "./LineItemRow";
import { formatMoney } from "@/lib/format";

/** Review the cart and place the order. Rendered inside <RequireAuth>. */
export default function Checkout() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, loading, open: openCart, placeOrder } = useCart();
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlaceOrder() {
    setError(null);
    setPlacing(true);
    try {
      const order = await placeOrder();
      setPlaced(true);
      router.replace(`/orders/${order.id}?placed=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your order couldn't be placed.");
      setPlacing(false);
    }
  }

  // After a successful order the cart empties before navigation finishes;
  // keep showing progress rather than flashing "your cart is empty".
  if (placed || loading || !cart) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
        <Spin />
        {placed && <p className="text-sm text-zinc-500">Order placed. Loading your receipt…</p>}
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <ShoppingCart className="h-10 w-10 text-zinc-300" />
        <p className="text-sm text-zinc-500">Your cart is empty, so there&apos;s nothing to check out.</p>
        <Link href="/">
          <Button type="primary">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  const stockProblem = cart.lines.some((line) => line.exceedsAvailable);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Checkout</h1>
          <p className="mt-1 text-sm text-zinc-500">Review your order, then place it.</p>
        </div>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Items</h2>
            <Button type="link" size="small" onClick={openCart}>
              Edit cart
            </Button>
          </div>
          <ul className="divide-y divide-zinc-100">
            {cart.lines.map((line) => (
              <LineItemRow
                key={line.itemId}
                name={line.name}
                imageUrl={line.imageUrl}
                category={line.category}
                quantity={line.quantity}
                unitPrice={line.unitPrice}
                regularPrice={line.regularPrice}
                isOnSale={line.isOnSale}
                lineSubtotal={line.lineSubtotal}
                warning={
                  line.exceedsAvailable
                    ? `Only ${line.quantityAvailable} in stock. Lower the quantity to continue.`
                    : undefined
                }
              />
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 text-base font-semibold text-zinc-900">Customer</h2>
          <p className="text-sm text-zinc-900">{user?.fullName}</p>
          <p className="text-sm text-zinc-500">{user?.email}</p>
        </section>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 lg:sticky lg:top-6">
        <h2 className="text-base font-semibold text-zinc-900">Order summary</h2>
        <DiscountCodeForm />
        <CartSummary cart={cart} />

        {error && <Alert type="error" showIcon title={error} />}
        {stockProblem && !error && (
          <Alert type="warning" showIcon title="Some items exceed the available stock." />
        )}

        <Button
          type="primary"
          size="large"
          block
          icon={<Lock className="h-4 w-4" />}
          loading={placing}
          disabled={stockProblem}
          onClick={handlePlaceOrder}
        >
          Place order · {formatMoney(cart.total)}
        </Button>
        <p className="text-center text-xs text-zinc-400">
          No payment is taken. Your order starts as Pending.
        </p>
      </aside>
    </div>
  );
}
