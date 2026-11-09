import Logo from "./Logo";
import HeaderCartButton from "./HeaderCartButton";
import AccountButton from "./AccountButton";
import SearchBar from "@/components/store/SearchBar";

interface StoreHeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
}

export default function StoreHeader({ query, onQueryChange }: StoreHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
      <Logo />

      <div className="flex flex-1 justify-center">
        <SearchBar query={query} onQueryChange={onQueryChange} />
      </div>

      <div className="flex items-center gap-1">
        <HeaderCartButton />
        <AccountButton />
      </div>
    </header>
  );
}
