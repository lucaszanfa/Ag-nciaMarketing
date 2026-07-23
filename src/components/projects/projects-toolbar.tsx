"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos os status" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "RUNNING", label: "Em andamento" },
  { value: "WAITING_APPROVAL", label: "Aguardando aprovação" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "FAILED", label: "Erro" },
  { value: "ARCHIVED", label: "Arquivado" },
];

export function ProjectsToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();

  function updateParams(next: { search?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.search !== undefined) {
      if (next.search) params.set("search", next.search);
      else params.delete("search");
    }
    if (next.status !== undefined) {
      if (next.status && next.status !== "ALL") params.set("status", next.status);
      else params.delete("status");
    }
    startTransition(() => router.push(`/projetos?${params.toString()}`));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParams({ search });
          }}
          onBlur={() => updateParams({ search })}
          placeholder="Pesquisar projetos..."
          className="pl-9"
        />
      </div>
      <Select
        defaultValue={searchParams.get("status") ?? "ALL"}
        onValueChange={(value) => updateParams({ status: value ?? "ALL" })}
      >
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
