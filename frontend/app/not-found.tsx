import Link from "next/link";
import { Button } from "antd";
import { SearchX } from "lucide-react";
import Logo from "@/components/header/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-4 text-center">
      <Logo />
      <div className="flex max-w-md flex-col items-center gap-3">
        <SearchX className="h-10 w-10 text-zinc-300" />
        <h1 className="text-xl font-semibold text-zinc-900">Page not found</h1>
        <p className="text-sm text-zinc-500">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link href="/" className="mt-2">
          <Button type="primary">Back to the store</Button>
        </Link>
      </div>
    </main>
  );
}
