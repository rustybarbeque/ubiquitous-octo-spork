"use client";

import { useRouter } from "next/navigation";
import { App, Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { CircleUserRound, LayoutDashboard, LogIn, LogOut, Package, Settings, UserPlus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const iconClass = "h-4 w-4";

export default function AccountButton() {
  const router = useRouter();
  const { message } = App.useApp();
  const { status, user, logout } = useAuth();

  const signedIn = status === "signed-in" && user;

  const items: MenuProps["items"] = signedIn
    ? [
        { key: "orders", label: "Order history", icon: <Package className={iconClass} /> },
        { key: "settings", label: "Account settings", icon: <Settings className={iconClass} /> },
        ...(user.isAdmin
          ? [
              { type: "divider" as const },
              { key: "admin", label: "Admin dashboard", icon: <LayoutDashboard className={iconClass} /> },
            ]
          : []),
        { type: "divider" },
        { key: "signout", label: "Sign out", icon: <LogOut className={iconClass} /> },
      ]
    : [
        { key: "signin", label: "Sign in", icon: <LogIn className={iconClass} /> },
        { key: "register", label: "Create account", icon: <UserPlus className={iconClass} /> },
      ];

  const onClick: MenuProps["onClick"] = ({ key }) => {
    switch (key) {
      case "signin":
        router.push("/login");
        break;
      case "register":
        router.push("/register");
        break;
      case "orders":
        router.push("/orders");
        break;
      case "settings":
        router.push("/account");
        break;
      case "admin":
        router.push("/admin");
        break;
      case "signout":
        logout();
        message.success("You've been signed out.");
        break;
    }
  };

  return (
    <Dropdown
      menu={{ items, onClick }}
      trigger={["click"]}
      placement="bottomRight"
      disabled={status === "loading"}
      popupRender={(menu) => (
        <div className="min-w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 px-3 py-2">
            <p className="text-sm font-medium text-zinc-900">{signedIn ? user.fullName : "Guest"}</p>
            <p className="text-xs text-zinc-500">
              {signedIn ? `${user.email}${user.isAdmin ? " · Admin" : ""}` : "Not signed in"}
            </p>
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
        {signedIn ? user.firstName : "Account"}
      </Button>
    </Dropdown>
  );
}
