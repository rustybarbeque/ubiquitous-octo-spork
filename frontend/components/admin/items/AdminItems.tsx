"use client";

import { useEffect, useState } from "react";
import { Alert, App, Button, Input, Popconfirm, Select, Table, Tooltip } from "antd";
import type { TableColumnsType } from "antd";
import { Archive, Boxes, Pencil, Plus, Tag as TagIcon } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { useAuth } from "@/components/auth/AuthProvider";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ItemFormModal from "./ItemFormModal";
import { SaleModal, StockModal } from "./ItemQuickModals";
import { archiveItem, getCategories, getItemsPage, ItemQuery } from "@/lib/services/admin-service";
import { formatMoney } from "@/lib/format";
import { Item, PagedResult } from "@/lib/types";

const PAGE_SIZE = 20;
const LOW_STOCK_THRESHOLD = 5;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "availability-asc", label: "Stock: Lowest first" },
  { value: "availability-desc", label: "Stock: Highest first" },
];

type Show = "all" | "on-sale" | "in-stock";

const SHOW_OPTIONS: { value: Show; label: string }[] = [
  { value: "all", label: "All items" },
  { value: "on-sale", label: "On sale only" },
  { value: "in-stock", label: "In stock only" },
];

/** Which dialog is open, and for which item. */
type Dialog = { kind: "create" } | { kind: "edit" | "sale" | "stock"; item: Item } | null;

type LoadState = { key: string; result: PagedResult<Item> } | { key: string; error: string };

function buildQuery(q: string, category: string | undefined, show: Show, sort: string, page: number): ItemQuery {
  return {
    q,
    category,
    onSaleOnly: show === "on-sale" || undefined,
    inStockOnly: show === "in-stock" || undefined,
    sort,
    page,
    pageSize: PAGE_SIZE,
  };
}

export default function AdminItems() {
  const { message } = App.useApp();
  const { token } = useAuth();

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [show, setShow] = useState<Show>("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [reloadCount, setReloadCount] = useState(0);

  const [state, setState] = useState<LoadState | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const key = JSON.stringify([q, category, show, sort, page, reloadCount]);

  useEffect(() => {
    let cancelled = false;
    getItemsPage(buildQuery(q, category, show, sort, page))
      .then((result) => !cancelled && setState({ key, result }))
      .catch((err) => !cancelled && setState({ key, error: err instanceof Error ? err.message : "Couldn't load items." }));
    return () => {
      cancelled = true;
    };
  }, [q, category, show, sort, page, key]);

  // Categories feed both the filter and the form's suggestions; refresh them
  // after every change, since saving an item can introduce a new one.
  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((list) => !cancelled && setCategories(list))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const loading = !state || state.key !== key;
  const result = state && "result" in state ? state.result : null;
  const reload = () => setReloadCount((n) => n + 1);

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  async function handleArchive(item: Item) {
    if (!token) return;
    setArchivingId(item.id);
    try {
      await archiveItem(token, item.id);
      message.success(`${item.name} was archived.`);
      reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "The item couldn't be archived.");
    } finally {
      setArchivingId(null);
    }
  }

  const columns: TableColumnsType<Item> = [
    {
      title: "Item",
      key: "item",
      render: (_, item) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100">
            <ProductImage src={item.imageUrl} alt={item.name} sizes="48px" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-zinc-900">{item.name}</p>
            <p className="text-xs text-zinc-500">{item.category}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      key: "price",
      align: "right",
      render: (_, item) =>
        item.isOnSale ? (
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1.5">
              <span className="rounded-full bg-red-600 px-1.5 py-px text-[10px] font-semibold text-white">SALE</span>
              <span className="font-medium tabular-nums text-red-600">{formatMoney(item.salePrice!)}</span>
            </span>
            <span className="text-xs tabular-nums text-zinc-400 line-through">{formatMoney(item.price)}</span>
          </div>
        ) : (
          <span className="tabular-nums">{formatMoney(item.price)}</span>
        ),
    },
    {
      title: "Stock",
      dataIndex: "quantityAvailable",
      align: "right",
      render: (quantity: number) => (
        <span
          className={`tabular-nums ${
            quantity === 0 ? "font-medium text-red-600" : quantity <= LOW_STOCK_THRESHOLD ? "text-amber-600" : ""
          }`}
        >
          {quantity === 0 ? "Out of stock" : quantity}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, item) => (
        <div className="flex justify-end gap-1">
          <Tooltip title="Edit all details">
            <Button size="small" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setDialog({ kind: "edit", item })}>
              Edit
            </Button>
          </Tooltip>
          <Tooltip title={item.isOnSale ? "Change or end the sale" : "Put on sale"}>
            <Button size="small" icon={<TagIcon className="h-3.5 w-3.5" />} onClick={() => setDialog({ kind: "sale", item })}>
              Sale
            </Button>
          </Tooltip>
          <Tooltip title="Update stock">
            <Button size="small" icon={<Boxes className="h-3.5 w-3.5" />} onClick={() => setDialog({ kind: "stock", item })}>
              Stock
            </Button>
          </Tooltip>
          <Popconfirm
            title={`Archive ${item.name}?`}
            description={
              <span className="block max-w-64">
                It leaves the store and every cart. Past orders that include it are kept.
              </span>
            }
            okText="Archive"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleArchive(item)}
          >
            <Tooltip title="Archive">
              <Button
                size="small"
                danger
                icon={<Archive className="h-3.5 w-3.5" />}
                loading={archivingId === item.id}
                aria-label={`Archive ${item.name}`}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const closeDialog = () => setDialog(null);
  const afterSave = (text: string) => {
    message.success(text);
    setDialog(null);
    reload();
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <AdminPageHeader
        title="Items"
        description="Add, edit, price, and restock the products for sale."
        actions={
          <Button type="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setDialog({ kind: "create" })}>
            New item
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Input.Search
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            if (event.target.value === "") resetToFirstPage(setQ)("");
          }}
          onSearch={(value) => resetToFirstPage(setQ)(value.trim())}
          placeholder="Search name or description"
          allowClear
          className="w-full sm:w-72"
        />
        <Select
          value={category}
          onChange={resetToFirstPage(setCategory)}
          allowClear
          placeholder="All categories"
          options={categories.map((value) => ({ value, label: value }))}
          className="w-full sm:w-48"
        />
        <Select value={show} onChange={resetToFirstPage(setShow)} options={SHOW_OPTIONS} className="w-full sm:w-40" />
        <Select value={sort} onChange={resetToFirstPage(setSort)} options={SORT_OPTIONS} className="w-full sm:w-48" />
      </div>

      {state && "error" in state && state.key === key && <Alert type="error" showIcon title={state.error} />}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <Table<Item>
          rowKey="id"
          columns={columns}
          dataSource={result?.items ?? []}
          loading={loading}
          scroll={{ x: 760 }}
          locale={{ emptyText: q || category || show !== "all" ? "No items match these filters." : "No items yet." }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: result?.total ?? 0,
            onChange: setPage,
            hideOnSinglePage: true,
            showSizeChanger: false,
            showTotal: (total) => `${total} item${total === 1 ? "" : "s"}`,
          }}
        />
      </div>

      {(dialog?.kind === "create" || dialog?.kind === "edit") && (
        <ItemFormModal
          item={dialog.kind === "edit" ? dialog.item : null}
          categories={categories}
          onClose={closeDialog}
          onSaved={(item, created) => afterSave(created ? `${item.name} was added to the store.` : `${item.name} was updated.`)}
        />
      )}
      {dialog?.kind === "sale" && <SaleModal item={dialog.item} onClose={closeDialog} onSaved={(_, text) => afterSave(text)} />}
      {dialog?.kind === "stock" && <StockModal item={dialog.item} onClose={closeDialog} onSaved={(_, text) => afterSave(text)} />}
    </div>
  );
}
