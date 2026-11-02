"use client";

import { Input } from "antd";
import { Search } from "lucide-react";

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
}

export default function SearchBar({ query, onQueryChange }: SearchBarProps) {
  return (
    <Input
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      placeholder="Search items or descriptions..."
      prefix={<Search className="h-4 w-4 text-zinc-400" />}
      allowClear
      className="w-full max-w-md"
    />
  );
}
