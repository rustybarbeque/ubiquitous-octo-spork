"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, App, Button, Input, Popconfirm, Select, Table, Tag, Tooltip } from "antd";
import type { TableColumnsType } from "antd";
import { Pencil, Receipt, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import UserFormModal from "./UserFormModal";
import { deleteUser, getUsersPage } from "@/lib/services/admin-service";
import { formatDate } from "@/lib/format";
import { PagedResult, User, UserRole } from "@/lib/types";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "email-asc", label: "Email: A to Z" },
  { value: "email-desc", label: "Email: Z to A" },
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "Customer", label: "Customers" },
  { value: "Admin", label: "Administrators" },
];

type LoadState = { key: string; result: PagedResult<User> } | { key: string; error: string };

export default function AdminUsers() {
  const { message } = App.useApp();
  const { token, user: me } = useAuth();

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [reloadCount, setReloadCount] = useState(0);

  const [state, setState] = useState<LoadState | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const key = JSON.stringify([q, role, sort, page, reloadCount]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getUsersPage(token, { q, role, sort, page, pageSize: PAGE_SIZE })
      .then((result) => !cancelled && setState({ key, result }))
      .catch((err) => !cancelled && setState({ key, error: err instanceof Error ? err.message : "Couldn't load users." }));
    return () => {
      cancelled = true;
    };
  }, [token, q, role, sort, page, key]);

  const loading = !state || state.key !== key;
  const result = state && "result" in state ? state.result : null;
  const reload = () => setReloadCount((n) => n + 1);

  async function handleDelete(user: User) {
    if (!token) return;
    setDeletingId(user.id);
    try {
      await deleteUser(token, user.id);
      message.success(`${user.fullName}'s account was deleted.`);
      reload();
    } catch (err) {
      // 409 when they have orders: the API's message explains why.
      message.error(err instanceof Error ? err.message : "The account couldn't be deleted.");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: TableColumnsType<User> = [
    {
      title: "Name",
      key: "name",
      render: (_, user) => (
        <span className="flex items-center gap-2 font-medium text-zinc-900">
          {user.fullName}
          {user.id === me?.id && <Tag className="m-0">You</Tag>}
        </span>
      ),
    },
    { title: "Email", dataIndex: "email", render: (email: string) => <span className="text-zinc-600">{email}</span> },
    {
      title: "Role",
      dataIndex: "role",
      render: (value: UserRole) => (
        <Tag color={value === "Admin" ? "purple" : "default"}>{value === "Admin" ? "Administrator" : "Customer"}</Tag>
      ),
    },
    { title: "Joined", dataIndex: "createdAt", render: (createdAt: string) => formatDate(createdAt) },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, user) => {
        const isSelf = user.id === me?.id;
        return (
          <div className="flex justify-end gap-1">
            <Button size="small" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(user)}>
              Edit
            </Button>
            <Tooltip title="Their orders">
              <Link href={`/admin/orders?q=${encodeURIComponent(user.email)}`}>
                <Button size="small" icon={<Receipt className="h-3.5 w-3.5" />} aria-label={`Orders by ${user.fullName}`}>
                  Orders
                </Button>
              </Link>
            </Tooltip>
            {isSelf ? (
              <Tooltip title="You can't delete your own account">
                <Button size="small" danger disabled icon={<Trash2 className="h-3.5 w-3.5" />} aria-label="Delete" />
              </Tooltip>
            ) : (
              <Popconfirm
                title={`Delete ${user.fullName}?`}
                description={
                  <span className="block max-w-64">
                    Their account and cart are removed. Accounts that have placed orders can&apos;t be deleted, so order
                    history stays intact.
                  </span>
                }
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDelete(user)}
              >
                <Button
                  size="small"
                  danger
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  loading={deletingId === user.id}
                  aria-label={`Delete ${user.fullName}`}
                />
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <AdminPageHeader
        title="Users"
        description="Customer and administrator accounts. Change a role here to promote someone to administrator."
      />

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
          placeholder="Search name or email"
          allowClear
          className="w-full sm:w-72"
        />
        <Select
          value={role}
          onChange={(value) => {
            setRole(value);
            setPage(1);
          }}
          allowClear
          placeholder="All roles"
          options={ROLE_OPTIONS}
          className="w-full sm:w-44"
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
      </div>

      {state && "error" in state && state.key === key && <Alert type="error" showIcon title={state.error} />}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <Table<User>
          rowKey="id"
          columns={columns}
          dataSource={result?.items ?? []}
          loading={loading}
          scroll={{ x: 760 }}
          locale={{ emptyText: q || role ? "No users match these filters." : "No users yet." }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: result?.total ?? 0,
            onChange: setPage,
            hideOnSinglePage: true,
            showSizeChanger: false,
            showTotal: (total) => `${total} user${total === 1 ? "" : "s"}`,
          }}
        />
      </div>

      {editing && (
        <UserFormModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(user) => {
            message.success(`${user.fullName}'s account was updated.`);
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
