"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  GitCompareArrows,
  History,
  Inbox,
  Library,
  PlusCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarNav, type SidebarNavItem } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/server/actions/auth.actions";
import type { UserRole } from "@/types/enums";

interface NavItem extends SidebarNavItem {
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Novo projeto", icon: PlusCircle, roles: ["ADMIN", "CEO", "COMMON"] },
  { href: "/aprovacoes", label: "Aprovações", icon: Inbox, roles: ["ADMIN", "CEO", "COMMON"] },
  { href: "/projetos", label: "Projetos", icon: FolderKanban, roles: ["ADMIN", "CEO", "COMMON"] },
  { href: "/biblioteca", label: "Biblioteca de conteúdos", icon: Library, roles: ["ADMIN", "CEO"] },
  { href: "/calendario", label: "Calendário editorial", icon: CalendarDays, roles: ["ADMIN", "CEO", "COMMON"] },
  { href: "/configuracoes", label: "Configurações", icon: Settings, roles: ["ADMIN", "CEO"] },
  { href: "/historico", label: "Histórico", icon: History, roles: ["ADMIN", "CEO"] },
  { href: "/admin", label: "Usuários", icon: ShieldCheck, roles: ["ADMIN"] },
  { href: "/comparar-ia", label: "Comparar IA", icon: GitCompareArrows, roles: ["ADMIN"] },
];

interface CurrentUser {
  name: string;
  role: UserRole;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  CEO: "CEO / Responsável de Marketing",
  COMMON: "Usuário",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  user,
  pendingApprovalCount = 0,
  children,
}: {
  user: CurrentUser;
  pendingApprovalCount?: number;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role)).map((item) =>
    item.href === "/aprovacoes" ? { ...item, badge: pendingApprovalCount } : item
  );

  function toggle() {
    setCollapsed((prev) => !prev);
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40">
      <aside
        className={cn(
          "relative hidden shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex h-14 items-center gap-2.5 px-4", collapsed && "justify-center px-2")}>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-sm">
            <Sparkles className="size-4" />
          </div>
          {!collapsed && <span className="truncate text-sm font-semibold tracking-tight">Marketing AI Studio</span>}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <SidebarNav items={navItems} collapsed={collapsed} />
        </div>

        <div className="border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-2 rounded-lg p-1.5", collapsed && "justify-center")}>
            <Avatar size="sm" className="ring-1 ring-sidebar-border">
              <AvatarFallback className="bg-primary/15 text-primary">{initials(user.name)}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
                </div>
                <ThemeToggle />
                <form action={logoutUser}>
                  <Button variant="ghost" size="icon-sm" title="Sair" aria-label="Sair" type="submit">
                    <LogOut className="size-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-center text-muted-foreground"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Marketing AI Studio</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/15 text-primary">{initials(user.name)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
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
