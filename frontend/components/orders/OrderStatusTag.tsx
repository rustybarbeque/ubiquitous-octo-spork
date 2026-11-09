import { Tag } from "antd";
import { OrderStatus } from "@/lib/types";

const COLORS: Record<OrderStatus, string> = {
  Pending: "gold",
  Paid: "blue",
  Shipped: "cyan",
  Delivered: "green",
  Cancelled: "red",
};

export default function OrderStatusTag({ status }: { status: OrderStatus }) {
  return <Tag color={COLORS[status]}>{status}</Tag>;
}
