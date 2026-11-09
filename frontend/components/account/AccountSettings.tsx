"use client";

import { Tag } from "antd";
import { useAuth } from "@/components/auth/AuthProvider";
import AccountSettingsForm from "./AccountSettingsForm";

const memberSince = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

/** The body of /account. Rendered inside <RequireAuth>, so a user is present. */
export default function AccountSettings() {
  const { user, token } = useAuth();
  if (!user || !token) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Account settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Update the name and email on your account.</p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Profile</h2>
        <AccountSettingsForm user={user} token={token} />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Account</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
          <dt className="text-zinc-500">Account type</dt>
          <dd>
            <Tag color={user.isAdmin ? "purple" : "default"}>{user.isAdmin ? "Administrator" : "Customer"}</Tag>
          </dd>
          <dt className="text-zinc-500">Member since</dt>
          <dd className="text-zinc-900">{memberSince.format(new Date(user.createdAt))}</dd>
        </dl>
        <p className="mt-4 text-xs text-zinc-400">
          Changing your name doesn&apos;t change the name on orders you&apos;ve already placed.
        </p>
      </section>
    </div>
  );
}
