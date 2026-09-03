"use client";

import { Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { CircleUserRound } from "lucide-react";

const items: MenuProps["items"] = [
  { key: "signin", label: "Sign in" },
  { key: "register", label: "Create account" },
  { key: "orders", label: "Order history" },
  { key: "settings", label: "Account settings" },
  { type: "divider" },
  { key: "admin", label: "Admin dashboard" },
];

export default function AccountButton() {
  return (
    <Dropdown
      menu={{ items }}
      trigger={["click"]}
      placement="bottomRight"
      popupRender={(menu) => (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 px-3 py-2">
            <p className="text-sm font-medium text-zinc-900">Guest</p>
            <p className="text-xs text-zinc-500">Not signed in</p>
          </div>
          {menu}
        </div>
      )}
    >
      <Button
        type="text"
        icon={<CircleUserRound className="h-5 w-5" strokeWidth={2} />}
        aria-label="Account menu"
      >
        Account
      </Button>
    </Dropdown>
  );
}
