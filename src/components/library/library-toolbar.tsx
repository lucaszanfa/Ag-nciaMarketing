"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

const PLATFORM_OPTIONS: Option[] = [
  { value: "ALL", label: "Todas as plataformas" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "GENERAL", label: "Geral" },
];

const FORMAT_OPTIONS: Option[] = [
  { value: "ALL", label: "Todos os formatos" },
  { value: "POST", label: "Post" },
  { value: "CAROUSEL", label: "Carrossel" },
  { value: "REELS", label: "Reels" },
  { value: "STORIES", label: "Stories" },
  { value: "CAMPAIGN_PLAN", label: "Campanha" },
];

const STATUS_OPTIONS: Option[] = [
  { value: "ALL", label: "Todos os status" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "REVIEWED", label: "Revisado" },
  { value: "UNDER_AI_REVIEW", label: "Em revisão pela IA" },
  { value: "AI_REVISING", label: "IA corrigindo" },
  { value: "WAITING_HUMAN_APPROVAL", label: "Aguardando aprovação" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "NEEDS_ADJUSTMENT", label: "Precisa de ajustes" },
  { value: "REJECTED", label: "Reprovado" },
  { value: "SCHEDULED", label: "Agendado" },
  { value: "PUBLISHED", label: "Publicado" },
  { value: "ARCHIVED", label: "Arquivado" },
];

const AGENT_OPTIONS: Option[] = [
  { value: "ALL", label: "Todos os agentes" },
  { value: "CHIEF_EDITOR", label: "Editor-chefe (briefings)" },
  { value: "LINKEDIN_WRITER", label: "Redator LinkedIn" },
  { value: "INSTAGRAM_WRITER", label: "Redator Instagram" },
  { value: "CAMPAIGN_WRITER", label: "Redator de campanhas" },
];

interface ProjectOption {
  id: string;
  title: string;
}

function FilterSelect({
  paramKey,
  options,
  placeholder,
}: {
  paramKey: string;
  options: Option[];
  placeholder: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(paramKey, value);
    else params.delete(paramKey);
    router.push(`/biblioteca?${params.toString()}`);
  }

  return (
    <Select defaultValue={searchParams.get(paramKey) ?? "ALL"} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder={placeholder} />
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

export function LibraryToolbar({ projects }: { projects: ProjectOption[] }) {
  const projectOptions: Option[] = [
    { value: "ALL", label: "Todos os projetos" },
    ...projects.map((p) => ({ value: p.id, label: p.title })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <FilterSelect paramKey="projectId" options={projectOptions} placeholder="Projeto" />
      <FilterSelect paramKey="agentType" options={AGENT_OPTIONS} placeholder="Agente" />
      <FilterSelect paramKey="platform" options={PLATFORM_OPTIONS} placeholder="Plataforma" />
      <FilterSelect paramKey="format" options={FORMAT_OPTIONS} placeholder="Formato" />
      <FilterSelect paramKey="status" options={STATUS_OPTIONS} placeholder="Status" />
    </div>
  );
}
