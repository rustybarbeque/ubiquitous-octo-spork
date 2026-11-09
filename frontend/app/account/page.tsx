import type { Metadata } from "next";
import SiteHeader from "@/components/header/SiteHeader";
import RequireAuth from "@/components/auth/RequireAuth";
import AccountSettings from "@/components/account/AccountSettings";

export const metadata: Metadata = { title: "Account settings | Macrocenter" };

export default function AccountPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <RequireAuth>
          <AccountSettings />
        </RequireAuth>
      </main>
    </div>
  );
}
