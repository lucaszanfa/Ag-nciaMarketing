import {
  Crown,
  ClipboardList,
  Briefcase,
  Camera,
  Megaphone,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { AgentType } from "@/types/enums";

export interface AgentMeta {
  type: AgentType;
  name: string;
  role: string;
  icon: LucideIcon;
}

export const AGENT_ORDER: AgentType[] = [
  "CEO",
  "CHIEF_EDITOR",
  "LINKEDIN_WRITER",
  "INSTAGRAM_WRITER",
  "CAMPAIGN_WRITER",
  "REVIEWER",
];

export const AGENT_META: Record<AgentType, AgentMeta> = {
  CEO: { type: "CEO", name: "CEO", role: "Solicitante do projeto", icon: Crown },
  CHIEF_EDITOR: {
    type: "CHIEF_EDITOR",
    name: "Editor-chefe",
    role: "Planejamento editorial",
    icon: ClipboardList,
  },
  LINKEDIN_WRITER: {
    type: "LINKEDIN_WRITER",
    name: "Redator LinkedIn",
    role: "Conteúdos para LinkedIn",
    icon: Briefcase,
  },
  INSTAGRAM_WRITER: {
    type: "INSTAGRAM_WRITER",
    name: "Redator Instagram",
    role: "Conteúdos para Instagram",
    icon: Camera,
  },
  CAMPAIGN_WRITER: {
    type: "CAMPAIGN_WRITER",
    name: "Redator de campanhas",
    role: "Campanha institucional",
    icon: Megaphone,
  },
  REVIEWER: { type: "REVIEWER", name: "Revisor", role: "Revisão de qualidade", icon: ShieldCheck },
};
