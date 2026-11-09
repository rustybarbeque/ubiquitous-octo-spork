"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spin } from "antd";
import { useAuth } from "./AuthProvider";

/**
 * Renders its children only for a signed-in user. Anyone else is sent to the
 * sign-in page, and comes back here afterwards.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (status === "signed-in") {
      wasSignedIn.current = true;
    } else if (status === "signed-out") {
      // Signing out from this page goes back to the store; arriving here
      // signed out goes to sign-in, then back here.
      router.replace(wasSignedIn.current ? "/" : `/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "signed-in") {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spin />
      </div>
    );
  }

  return <>{children}</>;
}
