"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button, Spin } from "antd";
import { CircleCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getOrder } from "@/lib/services/order-service";
import { describeDiscount } from "@/lib/discounts";
import { formatDateTime, orderReference } from "@/lib/format";
import { Order } from "@/lib/types";
import LineItemRow from "./LineItemRow";
import OrderStatusTag from "./OrderStatusTag";
import PriceSummary from "./PriceSummary";

type LoadState = { id: string; order: Order } | { id: string; error: string };

/** One placed order, exactly as frozen at checkout. Rendered inside <RequireAuth>. */
export default function OrderDetails({ id, justPlaced }: { id: string; justPlaced: boolean }) {
  const { token, user } = useAuth();
  const [state, setState] = useState<LoadState | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getOrder(token, id)
      .then((order) => !cancelled && setState({ id, order }))
      .catch((err) => !cancelled && setState({ id, error: err instanceof Error ? err.message : "Couldn't load the order." }));
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  if (!state || state.id !== id) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spin />
      </div>
    );
  }

  if ("error" in state) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <Alert type="error" showIcon title="We couldn't show this order." description={state.error} />
        <Link href="/orders">
          <Button>Back to your orders</Button>
        </Link>
      </div>
    );
  }

  const { order } = state;
  const discountLabel =
    order.discountCode && order.discountKind
      ? `${order.discountCode} · ${describeDiscount(order.discountKind, order.discountValue ?? 0)}`
      : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      {justPlaced && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
          <div>
            <p className="font-medium text-green-900">
              Thanks{user ? `, ${user.firstName}` : ""}! Your order has been placed.
            </p>
            <p className="text-sm text-green-800">
              We&apos;ve recorded it as Pending. You can find it any time under Order history.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/orders" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← All orders
          </Link>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-zinc-900">
            Order {orderReference(order.id)}
            <OrderStatusTag status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Placed {formatDateTime(order.placedAt)}</p>
        </div>
        <Link href="/">
          <Button>Continue shopping</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-2 text-base font-semibold text-zinc-900">Items</h2>
          <ul className="divide-y divide-zinc-100">
            {order.lines.map((line) => (
              <LineItemRow
                key={line.id}
                name={line.name}
                imageUrl={line.imageUrl}
                category={line.category}
                quantity={line.quantity}
                unitPrice={line.unitPrice}
                regularPrice={line.regularPrice}
                isOnSale={line.wasOnSale}
                lineSubtotal={line.lineSubtotal}
              />
            ))}
          </ul>
        </section>

        <aside className="flex h-fit flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-900">Order summary</h2>
          {discountLabel && (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Discount applied: <span className="font-semibold">{discountLabel}</span>
            </p>
          )}
          <PriceSummary
            itemCount={order.itemCount}
            subtotal={order.subtotal}
            discountCode={order.discountCode}
            discountAmount={order.discountAmount}
            taxRatePercent={order.taxRatePercent}
            taxAmount={order.taxAmount}
            total={order.total}
          />
          <div className="border-t border-zinc-100 pt-3 text-sm">
            <p className="text-zinc-500">Customer</p>
            <p className="text-zinc-900">{order.customerName}</p>
            <p className="text-zinc-500">{order.customerEmail}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
