"use client";

import { useState } from "react";
import { App, Select } from "antd";
import { useAuth } from "@/components/auth/AuthProvider";
import OrderStatusTag from "@/components/orders/OrderStatusTag";
import { updateOrderStatus } from "@/lib/services/admin-service";
import { ORDER_STATUSES } from "@/lib/orders";
import { Order, OrderStatus } from "@/lib/types";

interface OrderStatusSelectProps {
  orderId: string;
  status: OrderStatus;
  onChanged: (order: Order) => void;
  size?: "small" | "middle";
}

/** Changes an order's status in place. Cancelling asks for confirmation first. */
export default function OrderStatusSelect({ orderId, status, onChanged, size = "middle" }: OrderStatusSelectProps) {
  const { message, modal } = App.useApp();
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);

  async function save(next: OrderStatus) {
    if (!token || next === status) return;
    setSaving(true);
    try {
      const order = await updateOrderStatus(token, orderId, next);
      message.success(`Order marked ${next}.`);
      onChanged(order);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "The status couldn't be changed.");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(next: OrderStatus) {
    if (next !== "Cancelled") {
      save(next);
      return;
    }
    modal.confirm({
      title: "Cancel this order?",
      content: "The order is kept in history as Cancelled. Stock is not returned to inventory automatically.",
      okText: "Cancel order",
      okButtonProps: { danger: true },
      cancelText: "Keep it",
      onOk: () => save(next),
    });
  }

  return (
    // Stop clicks here from also opening the row they sit in.
    <span onClick={(event) => event.stopPropagation()}>
      <Select<OrderStatus>
        size={size}
        value={status}
        loading={saving}
        disabled={saving}
        onChange={handleChange}
        options={ORDER_STATUSES.map((value) => ({ value, label: <OrderStatusTag status={value} /> }))}
        popupMatchSelectWidth={false}
        variant="borderless"
        aria-label="Order status"
        className="min-w-32"
      />
    </span>
  );
}
