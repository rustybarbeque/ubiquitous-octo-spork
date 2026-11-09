"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Package, Receipt, TicketPercent, Users } from "lucide-react";
import Logo from "@/components/header/Logo";
import AccountButton from "@/components/header/AccountButton";
import RequireAdmin from "./RequireAdmin";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/items", label: "Items", icon: Package },
  { href: "/admin/discount-codes", label: "Discount codes", icon: TicketPercent },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** The administrative back end's frame: top bar, section navigation, admin-only gate. */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <Logo />
        <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white">
          Admin
        </span>
        <div className="flex flex-1 justify-end">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            View store
          </Link>
        </div>
        <AccountButton />
      </header>

      <RequireAdmin>
        <div className="flex flex-1 flex-col md:flex-row">
          <nav
            aria-label="Admin sections"
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-2 py-2 md:w-56 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-3 md:py-4"
          >
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "bg-zinc-900 font-medium text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </RequireAdmin>
    </div>
  );
}
