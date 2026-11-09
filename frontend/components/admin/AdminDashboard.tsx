"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Skeleton, Table } from "antd";
import type { TableColumnsType } from "antd";
import { ArrowRight, Package, Receipt, TicketPercent, Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import OrderStatusTag from "@/components/orders/OrderStatusTag";
import AdminPageHeader from "./AdminPageHeader";
import { getAdminOrders, getDiscountCodesPage, getItemsPage, getUsersPage } from "@/lib/services/admin-service";
import { formatDateTime, formatMoney, orderReference } from "@/lib/format";
import { CURRENT_STATUSES } from "@/lib/orders";
import { Item, OrderSummary } from "@/lib/types";

/** Stock at or below this is flagged, matching the storefront's "Only N left". */
const LOW_STOCK_THRESHOLD = 5;

interface DashboardData {
  itemCount: number;
  outOfStockCount: number;
  lowestStock: Item[];
  currentOrderCount: number;
  totalOrderCount: number;
  recentCurrentOrders: OrderSummary[];
  userCount: number;
  activeCodeCount: number;
}

async function loadDashboard(token: string): Promise<DashboardData> {
  const [items, inStock, lowest, current, allOrders, users, codes] = await Promise.all([
    getItemsPage({ pageSize: 1 }),
    getItemsPage({ inStockOnly: true, pageSize: 1 }),
    getItemsPage({ sort: "availability-asc", pageSize: 5 }),
    getAdminOrders(token, { status: CURRENT_STATUSES.join(","), sort: "date-desc", pageSize: 5 }),
    getAdminOrders(token, { pageSize: 1 }),
    getUsersPage(token, { pageSize: 1 }),
    getDiscountCodesPage(token, { activeOnly: true, pageSize: 1 }),
  ]);

  return {
    itemCount: items.total,
    outOfStockCount: items.total - inStock.total,
    lowestStock: lowest.items,
    currentOrderCount: current.total,
    totalOrderCount: allOrders.total,
    recentCurrentOrders: current.items,
    userCount: users.total,
    activeCodeCount: codes.total,
  };
}

function StatCard(props: { href: string; label: string; value: number; detail: string; icon: React.ElementType }) {
  const Icon = props.icon;
  return (
    <Link
      href={props.href}
      className="group flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between text-sm text-zinc-500">
        {props.label}
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>
      <p className="text-3xl font-semibold tabular-nums text-zinc-900">{props.value}</p>
      <p className="flex items-center gap-1 text-xs text-zinc-500">
        {props.detail}
        <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </p>
    </Link>
  );
}

function Panel({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        <Link href={href} className="text-xs text-zinc-500 hover:text-zinc-900">
          {linkLabel} →
        </Link>
      </div>
      {children}
    </section>
  );
}

const orderColumns: TableColumnsType<OrderSummary> = [
  { title: "Order", dataIndex: "id", render: (id: string) => <span className="font-medium">{orderReference(id)}</span> },
  { title: "Customer", dataIndex: "customerName" },
  { title: "Placed", dataIndex: "placedAt", render: (placedAt: string) => formatDateTime(placedAt) },
  { title: "Status", dataIndex: "status", render: (status: OrderSummary["status"]) => <OrderStatusTag status={status} /> },
  { title: "Total", dataIndex: "total", align: "right", render: (total: number) => <span className="tabular-nums">{formatMoney(total)}</span> },
];

type LoadState = { data: DashboardData } | { error: string };

export default function AdminDashboard() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [state, setState] = useState<LoadState | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    loadDashboard(token)
      .then((data) => !cancelled && setState({ data }))
      .catch((err) => !cancelled && setState({ error: err instanceof Error ? err.message : "Couldn't load the dashboard." }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const data = state && "data" in state ? state.data : null;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <AdminPageHeader title="Dashboard" description={`Welcome back${user ? `, ${user.firstName}` : ""}. Here's the store at a glance.`} />

      {state && "error" in state && <Alert type="error" showIcon title={state.error} />}

      {!state ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                href="/admin/orders"
                label="Current orders"
                value={data.currentOrderCount}
                detail={`Not yet delivered · ${data.totalOrderCount} all time`}
                icon={Receipt}
              />
              <StatCard
                href="/admin/items"
                label="Items for sale"
                value={data.itemCount}
                detail={data.outOfStockCount ? `${data.outOfStockCount} out of stock` : "All in stock"}
                icon={Package}
              />
              <StatCard
                href="/admin/discount-codes"
                label="Active discount codes"
                value={data.activeCodeCount}
                detail="Usable right now"
                icon={TicketPercent}
              />
              <StatCard href="/admin/users" label="Users" value={data.userCount} detail="Customers and admins" icon={Users} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
              <Panel title="Orders needing attention" href="/admin/orders" linkLabel="All orders">
                <Table<OrderSummary>
                  rowKey="id"
                  size="small"
                  columns={orderColumns}
                  dataSource={data.recentCurrentOrders}
                  pagination={false}
                  scroll={{ x: 560 }}
                  locale={{ emptyText: "No orders waiting to be delivered." }}
                  onRow={(order) => ({ onClick: () => router.push(`/admin/orders/${order.id}`), className: "cursor-pointer" })}
                />
              </Panel>

              <Panel title="Lowest stock" href="/admin/items" linkLabel="Manage items">
                <ul className="divide-y divide-zinc-100">
                  {data.lowestStock.map((item) => {
                    const out = item.quantityAvailable === 0;
                    const low = item.quantityAvailable <= LOW_STOCK_THRESHOLD;
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                        <span className="truncate text-zinc-900">{item.name}</span>
                        <span
                          className={`shrink-0 tabular-nums ${out ? "font-medium text-red-600" : low ? "text-amber-600" : "text-zinc-500"}`}
                        >
                          {out ? "Out of stock" : `${item.quantityAvailable} left`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </div>
          </>
        )
      )}
    </div>
  );
}
