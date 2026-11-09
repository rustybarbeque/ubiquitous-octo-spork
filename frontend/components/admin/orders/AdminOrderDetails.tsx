"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button, Spin } from "antd";
import { useAuth } from "@/components/auth/AuthProvider";
import LineItemRow from "@/components/orders/LineItemRow";
import PriceSummary from "@/components/orders/PriceSummary";
import OrderStatusSelect from "./OrderStatusSelect";
import { getAdminOrder } from "@/lib/services/admin-service";
import { describeDiscount } from "@/lib/discounts";
import { formatDateTime, orderReference } from "@/lib/format";
import { Order } from "@/lib/types";

type LoadState = { id: string; order: Order } | { id: string; error: string };

/** One customer's order, as frozen at checkout, with its status editable. */
export default function AdminOrderDetails({ id }: { id: string }) {
  const { token } = useAuth();
  const [state, setState] = useState<LoadState | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getAdminOrder(token, id)
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
        <Link href="/admin/orders">
          <Button>Back to orders</Button>
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
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← All orders
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Order {orderReference(order.id)}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Placed {formatDateTime(order.placedAt)}
            {order.updatedAt !== order.placedAt && ` · last updated ${formatDateTime(order.updatedAt)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white py-1 pl-3 pr-1">
          <span className="text-sm text-zinc-500">Status</span>
          <OrderStatusSelect
            orderId={order.id}
            status={order.status}
            onChanged={(updated) => setState({ id, order: updated })}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-2 text-base font-semibold text-zinc-900">
            Items ({order.itemCount})
          </h2>
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
          <p className="mt-2 text-xs text-zinc-400">
            Prices are as charged at checkout. Later changes to these products don&apos;t affect this order.
          </p>
        </section>

        <aside className="flex h-fit flex-col gap-4">
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="mb-3 text-base font-semibold text-zinc-900">Customer</h2>
            <p className="text-sm text-zinc-900">{order.customerName}</p>
            <p className="text-sm text-zinc-500">{order.customerEmail}</p>
            <Link
              href={`/admin/orders?q=${encodeURIComponent(order.customerEmail)}`}
              className="mt-2 inline-block text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              All orders from this customer
            </Link>
          </section>

          <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6">
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
          </section>
        </aside>
      </div>
    </div>
  );
}
