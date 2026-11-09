"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "antd";
import { CloudOff } from "lucide-react";
import Logo from "@/components/header/Logo";

/**
 * Shown when a page fails to render, most often because the API is down
 * (the storefront reads the catalog from it on every request).
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-4 text-center">
      <Logo />
      <div className="flex max-w-md flex-col items-center gap-3">
        <CloudOff className="h-10 w-10 text-zinc-300" />
        <h1 className="text-xl font-semibold text-zinc-900">The store can&apos;t be reached right now</h1>
        <p className="text-sm text-zinc-500">
          We couldn&apos;t load this page. The server may be starting up or temporarily unavailable. Please try again in
          a moment.
        </p>
        <div className="mt-2 flex gap-2">
          <Button type="primary" onClick={() => retry()}>
            Try again
          </Button>
          <Link href="/">
            <Button>Go to the store</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
