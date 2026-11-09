"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Input, Select, Table, Tabs } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import type { SortOrder } from "antd/es/table/interface";
import { useAuth } from "@/components/auth/AuthProvider";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import OrderStatusSelect from "./OrderStatusSelect";
import { AdminOrderSort, getAdminOrders } from "@/lib/services/admin-service";
import { COMPLETED_STATUSES, CURRENT_STATUSES } from "@/lib/orders";
import { formatDateTime, formatMoney, orderReference } from "@/lib/format";
import { OrderSummary, PagedResult } from "@/lib/types";

const PAGE_SIZE = 20;

type View = "current" | "completed" | "all";

const VIEW_STATUSES: Record<View, string | undefined> = {
  current: CURRENT_STATUSES.join(","),
  completed: COMPLETED_STATUSES.join(","),
  all: undefined,
};

const SORT_OPTIONS: { value: AdminOrderSort; label: string }[] = [
  { value: "date-desc", label: "Order date: Newest first" },
  { value: "date-asc", label: "Order date: Oldest first" },
  { value: "customer-asc", label: "Customer: A to Z" },
  { value: "customer-desc", label: "Customer: Z to A" },
  { value: "total-desc", label: "Order total: High to Low" },
  { value: "total-asc", label: "Order total: Low to High" },
];

/** Which API sort each sortable column maps to, by direction. */
const COLUMN_SORTS: Record<string, { ascend: AdminOrderSort; descend: AdminOrderSort }> = {
  placedAt: { ascend: "date-asc", descend: "date-desc" },
  customerName: { ascend: "customer-asc", descend: "customer-desc" },
  total: { ascend: "total-asc", descend: "total-desc" },
};

function sortOrderFor(column: string, sort: AdminOrderSort): SortOrder {
  const map = COLUMN_SORTS[column];
  if (sort === map.ascend) return "ascend";
  if (sort === map.descend) return "descend";
  return null;
}

type LoadState = { key: string; result: PagedResult<OrderSummary> } | { key: string; error: string };
type Counts = Record<View, number>;

/** Every customer's orders: current, completed, or all, searchable and sortable. */
export default function AdminOrders({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const { token } = useAuth();

  const [view, setView] = useState<View>(initialQuery ? "all" : "current");
  const [search, setSearch] = useState(initialQuery);
  const [q, setQ] = useState(initialQuery);
  const [sort, setSort] = useState<AdminOrderSort>("date-desc");
  const [page, setPage] = useState(1);
  const [reloadCount, setReloadCount] = useState(0);

  const [state, setState] = useState<LoadState | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);

  const key = JSON.stringify([view, q, sort, page, reloadCount]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getAdminOrders(token, { status: VIEW_STATUSES[view], q, sort, page, pageSize: PAGE_SIZE })
      .then((result) => !cancelled && setState({ key, result }))
      .catch((err) => !cancelled && setState({ key, error: err instanceof Error ? err.message : "Couldn't load orders." }));
    return () => {
      cancelled = true;
    };
  }, [token, view, q, sort, page, key]);

  // Tab badges: how many orders each view holds for the current search.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const count = (status?: string) => getAdminOrders(token, { status, q, pageSize: 1 }).then((r) => r.total);
    Promise.all([count(VIEW_STATUSES.current), count(VIEW_STATUSES.completed), count()])
      .then(([current, completed, all]) => !cancelled && setCounts({ current, completed, all }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, q, reloadCount]);

  const loading = !state || state.key !== key;
  const result = state && "result" in state ? state.result : null;
  const reload = () => setReloadCount((n) => n + 1);

  const changeSort = (next: AdminOrderSort) => {
    setSort(next);
    setPage(1);
  };

  const columns: TableColumnsType<OrderSummary> = [
    {
      title: "Order",
      dataIndex: "id",
      render: (id: string) => <span className="font-medium text-zinc-900">{orderReference(id)}</span>,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      sorter: true,
      sortOrder: sortOrderFor("customerName", sort),
      render: (_, order) => (
        <div>
          <p className="text-zinc-900">{order.customerName}</p>
          <p className="text-xs text-zinc-500">{order.customerEmail}</p>
        </div>
      ),
    },
    {
      title: "Placed",
      dataIndex: "placedAt",
      sorter: true,
      sortOrder: sortOrderFor("placedAt", sort),
      render: (placedAt: string) => formatDateTime(placedAt),
    },
    { title: "Items", dataIndex: "itemCount", align: "right" },
    {
      title: "Status",
      dataIndex: "status",
      render: (_, order) => (
        <OrderStatusSelect size="small" orderId={order.id} status={order.status} onChanged={reload} />
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      align: "right",
      sorter: true,
      sortOrder: sortOrderFor("total", sort),
      render: (total: number) => <span className="font-medium tabular-nums">{formatMoney(total)}</span>,
    },
  ];

  const handleTableChange: TableProps<OrderSummary>["onChange"] = (pagination, _filters, sorter, { action }) => {
    if (action === "paginate") {
      setPage(pagination.current ?? 1);
      return;
    }
    if (action !== "sort") return;

    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = typeof single?.field === "string" ? single.field : undefined;
    // Clearing a column's sort falls back to the default, newest first.
    changeSort(field && single.order && COLUMN_SORTS[field] ? COLUMN_SORTS[field][single.order] : "date-desc");
  };

  const tabLabel = (label: string, count: number | undefined) => (
    <span className="flex items-center gap-2">
      {label}
      {count !== undefined && (
        <span className="rounded-full bg-zinc-100 px-1.5 text-xs tabular-nums text-zinc-600">{count}</span>
      )}
    </span>
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <AdminPageHeader
        title="Orders"
        description="Current orders and the full order history. Select an order to see its details."
      />

      <Tabs
        activeKey={view}
        onChange={(next) => {
          setView(next as View);
          setPage(1);
        }}
        items={[
          { key: "current", label: tabLabel("Current", counts?.current) },
          { key: "completed", label: tabLabel("Completed", counts?.completed) },
          { key: "all", label: tabLabel("All orders", counts?.all) },
        ]}
        className="-mb-4"
      />
      <p className="text-xs text-zinc-500">
        {view === "current" && "Pending, paid, and shipped orders that haven't been delivered yet."}
        {view === "completed" && "Delivered and cancelled orders."}
        {view === "all" && "Every order ever placed."}
      </p>

      <div className="flex flex-wrap gap-2">
        <Input.Search
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            if (event.target.value === "") {
              setQ("");
              setPage(1);
            }
          }}
          onSearch={(value) => {
            setQ(value.trim());
            setPage(1);
          }}
          placeholder="Search customer name or email"
          allowClear
          className="w-full sm:w-72"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          Sort by
          <Select value={sort} onChange={changeSort} options={SORT_OPTIONS} className="w-56" />
        </label>
      </div>

      {state && "error" in state && state.key === key && <Alert type="error" showIcon title={state.error} />}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <Table<OrderSummary>
          rowKey="id"
          columns={columns}
          dataSource={result?.items ?? []}
          loading={loading}
          scroll={{ x: 860 }}
          onChange={handleTableChange}
          showSorterTooltip={false}
          sortDirections={["descend", "ascend"]}
          onRow={(order) => ({
            onClick: () => router.push(`/admin/orders/${order.id}`),
            className: "cursor-pointer",
          })}
          locale={{
            emptyText: q
              ? `No orders match "${q}" here.`
              : view === "current"
                ? "No orders are waiting to be delivered."
                : "No orders yet.",
          }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: result?.total ?? 0,
            hideOnSinglePage: true,
            showSizeChanger: false,
            showTotal: (total) => `${total} order${total === 1 ? "" : "s"}`,
          }}
        />
      </div>
    </div>
  );
}
