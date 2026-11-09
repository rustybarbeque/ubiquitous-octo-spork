"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Select, Table } from "antd";
import type { TableColumnsType } from "antd";
import { Package } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMyOrders, MyOrdersSort } from "@/lib/services/order-service";
import { formatDateTime, formatMoney, orderReference } from "@/lib/format";
import { OrderSummary, PagedResult } from "@/lib/types";
import OrderStatusTag from "./OrderStatusTag";

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: MyOrdersSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-desc", label: "Total: High to Low" },
  { value: "total-asc", label: "Total: Low to High" },
];

const columns: TableColumnsType<OrderSummary> = [
  {
    title: "Order",
    dataIndex: "id",
    render: (id: string) => <span className="font-medium text-zinc-900">{orderReference(id)}</span>,
  },
  { title: "Placed", dataIndex: "placedAt", render: (placedAt: string) => formatDateTime(placedAt) },
  { title: "Items", dataIndex: "itemCount", align: "right" },
  { title: "Status", dataIndex: "status", render: (status: OrderSummary["status"]) => <OrderStatusTag status={status} /> },
  {
    title: "Total",
    dataIndex: "total",
    align: "right",
    render: (total: number) => <span className="font-medium tabular-nums">{formatMoney(total)}</span>,
  },
];

type LoadState = { key: string; result: PagedResult<OrderSummary> } | { key: string; error: string };

/** The signed-in customer's own orders. Rendered inside <RequireAuth>. */
export default function OrderHistory() {
  const router = useRouter();
  const { token } = useAuth();
  const [sort, setSort] = useState<MyOrdersSort>("newest");
  const [page, setPage] = useState(1);
  const [state, setState] = useState<LoadState | null>(null);

  const key = `${sort}|${page}`;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getMyOrders(token, { sort, page, pageSize: PAGE_SIZE })
      .then((result) => !cancelled && setState({ key, result }))
      .catch((err) => !cancelled && setState({ key, error: err instanceof Error ? err.message : "Couldn't load your orders." }));
    return () => {
      cancelled = true;
    };
  }, [token, sort, page, key]);

  const loading = !state || state.key !== key;
  const result = state && "result" in state ? state.result : null;
  const isEmpty = !loading && result?.total === 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Order history</h1>
          <p className="mt-1 text-sm text-zinc-500">Every order you&apos;ve placed. Select one to see its details.</p>
        </div>
        {!isEmpty && (
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            Sort by
            <Select
              value={sort}
              options={SORT_OPTIONS}
              onChange={(value) => {
                setSort(value);
                setPage(1);
              }}
              style={{ width: 180 }}
            />
          </label>
        )}
      </div>

      {state && "error" in state && state.key === key && <Alert type="error" showIcon title={state.error} />}

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-200 bg-white py-16 text-center">
          <Package className="h-10 w-10 text-zinc-300" />
          <p className="text-sm text-zinc-500">You haven&apos;t placed any orders yet.</p>
          <Link href="/">
            <Button type="primary">Start shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <Table<OrderSummary>
            rowKey="id"
            columns={columns}
            dataSource={result?.items ?? []}
            loading={loading}
            scroll={{ x: 640 }}
            onRow={(order) => ({
              onClick: () => router.push(`/orders/${order.id}`),
              className: "cursor-pointer",
            })}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: result?.total ?? 0,
              onChange: setPage,
              hideOnSinglePage: true,
              showSizeChanger: false,
            }}
          />
        </div>
      )}
    </div>
  );
}
