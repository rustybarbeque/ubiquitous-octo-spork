import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "./Logo";
import AccountButton from "./AccountButton";
import HeaderCartButton from "./HeaderCartButton";

/** The header for pages other than the storefront: logo, a way back, account menu. */
export default function SiteHeader() {
  return (
    <header className="flex shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
      <Logo />

      <div className="flex flex-1 justify-end">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <HeaderCartButton />
        <AccountButton />
      </div>
    </header>
  );
}
