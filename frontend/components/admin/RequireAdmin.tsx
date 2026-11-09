"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "antd";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import RequireAuth from "@/components/auth/RequireAuth";
import { tokenRole } from "@/lib/auth/token";

function Notice({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        {icon}
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuth();

  if (!user?.isAdmin) {
    return (
      <Notice icon={<ShieldAlert className="h-10 w-10 text-zinc-300" />} title="Administrators only">
        <p className="text-sm text-zinc-500">
          You&apos;re signed in as {user?.email}, which isn&apos;t an administrator account.
        </p>
        <Link href="/">
          <Button type="primary">Back to store</Button>
        </Link>
      </Notice>
    );
  }

  // The account is an admin, but this sign-in predates the promotion, and the
  // API authorizes by the token. A fresh sign-in issues an Admin token.
  if (token && tokenRole(token) !== "Admin") {
    return (
      <Notice icon={<RefreshCw className="h-10 w-10 text-zinc-300" />} title="Sign in again to use admin tools">
        <p className="text-sm text-zinc-500">
          Your account was made an administrator after you signed in. Sign in once more to activate admin
          access.
        </p>
        <Button
          type="primary"
          onClick={() => {
            logout();
            router.push(`/login?next=${encodeURIComponent(pathname)}`);
          }}
        >
          Sign in again
        </Button>
      </Notice>
    );
  }

  return <>{children}</>;
}

/** Renders its children only for a signed-in administrator with an Admin token. */
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AdminGate>{children}</AdminGate>
    </RequireAuth>
  );
}
