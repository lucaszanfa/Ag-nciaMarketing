"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProject, duplicateProject } from "@/server/actions/project.actions";
import { toast } from "sonner";

export function ProjectCardActions({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteProject(projectId);
      toast.success("Projeto excluído.");
      setDialogOpen(false);
      router.refresh();
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      const newId = await duplicateProject(projectId);
      toast.success("Projeto duplicado.");
      router.push(`/projetos/${newId}`);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDuplicate} disabled={isPending}>
            <Copy className="size-4" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDialogOpen(true);
            }}
          >
            <Trash2 className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todos os conteúdos e o histórico deste projeto serão
              excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
