"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  History,
  Library,
  PlusCircle,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarNav, type SidebarNavItem } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

const NAV_ITEMS: SidebarNavItem[] = [
  { href: "/", label: "Novo projeto", icon: PlusCircle },
  { href: "/projetos", label: "Projetos", icon: FolderKanban },
  { href: "/biblioteca", label: "Biblioteca de conteúdos", icon: Library },
  { href: "/calendario", label: "Calendário editorial", icon: CalendarDays },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/historico", label: "Histórico", icon: History },
];

interface CurrentUser {
  name: string;
  role: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  function toggle() {
    setCollapsed((prev) => !prev);
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/30">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-background transition-all duration-200 md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <Sparkles className="size-5 shrink-0 text-primary" />
          {!collapsed && <span className="truncate text-sm font-semibold">Marketing AI Studio</span>}
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav items={NAV_ITEMS} collapsed={collapsed} />
        </div>

        <div className="border-t border-border p-3">
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <Avatar size="sm">
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.role}</p>
              </div>
            )}
            {!collapsed && (
              <Button variant="ghost" size="icon-sm" title="Sair" aria-label="Sair">
                <LogOut className="size-4" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-center"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <span className="text-sm font-semibold">Marketing AI Studio</span>
        </Link>
        <Avatar size="sm">
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
      </div>

      <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around border-t border-border bg-background md:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground"
            >
              <Icon className="size-5" />
              <span className="truncate px-1">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
