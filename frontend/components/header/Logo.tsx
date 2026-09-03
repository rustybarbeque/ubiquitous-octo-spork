import Link from "next/link";
import { Store } from "lucide-react";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 rounded-md text-zinc-900 transition-opacity hover:opacity-80"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
        <Store className="h-8 w-8" strokeWidth={2} />
      </span>
      <span className="flex items-baseline leading-none">
        <span className="text-4xl font-extrabold tracking-tight">MACRO</span>
        <span className="text-2xl font-medium text-zinc-500">center</span>
      </span>
    </Link>
  );
}
