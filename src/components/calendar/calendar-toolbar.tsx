"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMonths, addWeeks, parseAnchorDate, toDateInputValue } from "@/lib/calendar-dates";

interface Option {
  value: string;
  label: string;
}

const PLATFORM_OPTIONS: Option[] = [
  { value: "ALL", label: "Todas as redes" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "GENERAL", label: "Geral" },
];

const STATUS_OPTIONS: Option[] = [
  { value: "ALL", label: "Todos os status" },
  { value: "SCHEDULED", label: "Agendado" },
  { value: "PUBLISHED", label: "Publicado" },
];

interface ProjectOption {
  id: string;
  title: string;
}

function FilterSelect({ paramKey, options, placeholder }: { paramKey: string; options: Option[]; placeholder: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(paramKey, value);
    else params.delete(paramKey);
    router.push(`/calendario?${params.toString()}`);
  }

  return (
    <Select defaultValue={searchParams.get(paramKey) ?? "ALL"} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-44">
        <SelectValue placeholder={placeholder}>
          {(value: string) => options.find((o) => o.value === value)?.label ?? placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CalendarToolbar({ projects, anchor, view }: { projects: ProjectOption[]; anchor: Date; view: "month" | "week" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectOptions: Option[] = [{ value: "ALL", label: "Todos os projetos" }, ...projects.map((p) => ({ value: p.id, label: p.title }))];

  function navigate(params: URLSearchParams) {
    router.push(`/calendario?${params.toString()}`);
  }

  function goToDate(date: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", toDateInputValue(date));
    navigate(params);
  }

  function setView(nextView: "month" | "week") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    navigate(params);
  }

  function handlePrev() {
    goToDate(view === "month" ? addMonths(anchor, -1) : addWeeks(anchor, -1));
  }

  function handleNext() {
    goToDate(view === "month" ? addMonths(anchor, 1) : addWeeks(anchor, 1));
  }

  function handleToday() {
    goToDate(parseAnchorDate(undefined));
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon-sm" onClick={handlePrev} aria-label="Período anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday}>
          Hoje
        </Button>
        <Button variant="outline" size="icon-sm" onClick={handleNext} aria-label="Próximo período">
          <ChevronRight className="size-4" />
        </Button>
        <div className="ml-1 flex overflow-hidden rounded-lg border border-border">
          <Button
            variant={view === "month" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setView("month")}
          >
            Mês
          </Button>
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setView("week")}
          >
            Semana
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterSelect paramKey="projectId" options={projectOptions} placeholder="Projeto" />
        <FilterSelect paramKey="platform" options={PLATFORM_OPTIONS} placeholder="Rede" />
        <FilterSelect paramKey="status" options={STATUS_OPTIONS} placeholder="Status" />
      </div>
    </div>
  );
}
