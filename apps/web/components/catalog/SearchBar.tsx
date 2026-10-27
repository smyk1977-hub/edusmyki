"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  defaultValue?: string;
}

export function SearchBar({ defaultValue }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set("szukaj", term);
      } else {
        params.delete("szukaj");
      }
      params.delete("strona");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="search"
        placeholder="Szukaj materiałów..."
        defaultValue={defaultValue}
        className="pl-10"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch((e.target as HTMLInputElement).value);
          }
        }}
      />
    </div>
  );
}
