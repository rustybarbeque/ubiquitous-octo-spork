"use client";

import { useEffect, useState } from "react";
import { Alert, App, Button, Input, Popconfirm, Select, Switch, Table, Tag, Tooltip } from "antd";
import type { TableColumnsType } from "antd";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DiscountCodeFormModal from "./DiscountCodeFormModal";
import {
  deleteDiscountCode,
  discountCodeInput,
  getDiscountCodesPage,
  updateDiscountCode,
} from "@/lib/services/admin-service";
import { describeDiscount, describeWindow, discountCodeState, DiscountCodeState } from "@/lib/discounts";
import { formatMoney } from "@/lib/format";
import { DiscountCode, PagedResult } from "@/lib/types";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "code-asc", label: "Code: A to Z" },
  { value: "code-desc", label: "Code: Z to A" },
];

const STATE_COLORS: Record<DiscountCodeState, string> = {
  Active: "green",
  Scheduled: "blue",
  Expired: "default",
  Disabled: "red",
};

type Dialog = { kind: "create" } | { kind: "edit"; code: DiscountCode } | null;

type LoadState = { key: string; result: PagedResult<DiscountCode> } | { key: string; error: string };

export default function AdminDiscountCodes() {
  const { message } = App.useApp();
  const { token } = useAuth();

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [reloadCount, setReloadCount] = useState(0);

  const [state, setState] = useState<LoadState | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const key = JSON.stringify([q, activeOnly, sort, page, reloadCount]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getDiscountCodesPage(token, { q, activeOnly: activeOnly || undefined, sort, page, pageSize: PAGE_SIZE })
      .then((result) => !cancelled && setState({ key, result }))
      .catch((err) => !cancelled && setState({ key, error: err instanceof Error ? err.message : "Couldn't load discount codes." }));
    return () => {
      cancelled = true;
    };
  }, [token, q, activeOnly, sort, page, key]);

  const loading = !state || state.key !== key;
  const result = state && "result" in state ? state.result : null;
  const reload = () => setReloadCount((n) => n + 1);

  async function toggleActive(code: DiscountCode, isActive: boolean) {
    if (!token) return;
    setBusyId(code.id);
    try {
      await updateDiscountCode(token, code.id, { ...discountCodeInput(code), isActive });
      message.success(isActive ? `${code.code} is switched on.` : `${code.code} is switched off. Carts using it lose the discount.`);
      reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "The code couldn't be updated.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(code: DiscountCode) {
    if (!token) return;
    setBusyId(code.id);
    try {
      await deleteDiscountCode(token, code.id);
      message.success(`${code.code} was deleted.`);
      reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "The code couldn't be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: TableColumnsType<DiscountCode> = [
    {
      title: "Code",
      key: "code",
      render: (_, code) => (
        <div>
          <p className="font-mono font-semibold text-zinc-900">{code.code}</p>
          {code.description && <p className="text-xs text-zinc-500">{code.description}</p>}
        </div>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      render: (_, code) => (
        <div>
          <p className="text-zinc-900">{describeDiscount(code.kind, code.value)}</p>
          <p className="text-xs text-zinc-500">
            {code.minimumSubtotal ? `On orders of ${formatMoney(code.minimumSubtotal)}+` : "No minimum"}
          </p>
        </div>
      ),
    },
    {
      title: "Valid",
      key: "window",
      render: (_, code) => <span className="text-sm text-zinc-600">{describeWindow(code.startsAt, code.endsAt)}</span>,
    },
    {
      title: "Status",
      key: "status",
      render: (_, code) => {
        const status = discountCodeState(code);
        return <Tag color={STATE_COLORS[status]}>{status}</Tag>;
      },
    },
    {
      title: "On",
      key: "active",
      align: "center",
      render: (_, code) => (
        <Tooltip title={code.isActive ? "Switch off" : "Switch on"}>
          <Switch
            size="small"
            checked={code.isActive}
            loading={busyId === code.id}
            onChange={(checked) => toggleActive(code, checked)}
            aria-label={`${code.code} active`}
          />
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, code) => (
        <div className="flex justify-end gap-1">
          <Button size="small" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setDialog({ kind: "edit", code })}>
            Edit
          </Button>
          <Popconfirm
            title={`Delete ${code.code}?`}
            description={
              <span className="block max-w-64">
                Carts using it lose the discount. Orders already placed keep theirs. To pause a code instead, switch it off.
              </span>
            }
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(code)}
          >
            <Button size="small" danger icon={<Trash2 className="h-3.5 w-3.5" />} aria-label={`Delete ${code.code}`} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <AdminPageHeader
        title="Discount codes"
        description="Codes customers apply in their cart. Changes reach every cart using the code on its next load."
        actions={
          <Button type="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setDialog({ kind: "create" })}>
            New code
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
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
          placeholder="Search code or description"
          allowClear
          className="w-full sm:w-72"
        />
        <Select
          value={sort}
          onChange={(value) => {
            setSort(value);
            setPage(1);
          }}
          options={SORT_OPTIONS}
          className="w-full sm:w-44"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <Switch
            size="small"
            checked={activeOnly}
            onChange={(checked) => {
              setActiveOnly(checked);
              setPage(1);
            }}
          />
          Usable right now only
        </label>
      </div>

      {state && "error" in state && state.key === key && <Alert type="error" showIcon title={state.error} />}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <Table<DiscountCode>
          rowKey="id"
          columns={columns}
          dataSource={result?.items ?? []}
          loading={loading}
          scroll={{ x: 820 }}
          locale={{ emptyText: q || activeOnly ? "No codes match these filters." : "No discount codes yet." }}
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

      {dialog && (
        <DiscountCodeFormModal
          code={dialog.kind === "edit" ? dialog.code : null}
          onClose={() => setDialog(null)}
          onSaved={(code, created) => {
            message.success(created ? `${code.code} was created.` : `${code.code} was updated.`);
            setDialog(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
