"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, Pencil, Archive, History, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  addContentComment,
  approveContent,
  archiveContent,
  markContentAsPublished,
  rejectContent,
  requestContentAdjustment,
  sendContentBackToAgent,
  updateContent,
} from "@/server/actions/content.actions";
import { ScheduleDialog } from "@/components/calendar/schedule-dialog";
import { formatDateTime } from "@/lib/format";
import type { ContentStatus } from "@/types/enums";

const VERSION_SOURCE_LABEL: Record<string, string> = {
  INITIAL_GENERATION: "Geração inicial",
  AUTOMATIC_REVISION: "Correção automática",
  HUMAN_EDIT: "Edição manual",
  HUMAN_REQUESTED_REVISION: "Correção solicitada",
};

const SENDABLE_BACK_STATUSES = new Set<ContentStatus>([
  "WAITING_HUMAN_APPROVAL",
  "APPROVED",
  "NEEDS_ADJUSTMENT",
  "REJECTED",
]);

export interface ContentVersionSummary {
  versionNumber: number;
  contentData: unknown;
  source: string;
  revisionAttempt: number;
  usedFallback: boolean;
  createdAt: string | Date;
}

export interface ContentCommentSummary {
  id: string;
  authorName: string;
  content: string;
  createdAt: string | Date;
}

export function ContentActions({
  contentId,
  copyText,
  rawContent,
  status,
  scheduledAt,
  showArchive = false,
  versions = [],
  comments = [],
}: {
  contentId: string;
  copyText: string;
  rawContent: unknown;
  status?: ContentStatus;
  scheduledAt?: string | Date | null;
  showArchive?: boolean;
  versions?: ContentVersionSummary[];
  comments?: ContentCommentSummary[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [editValue, setEditValue] = useState(() => JSON.stringify(rawContent, null, 2));
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleCopy() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    toast.success("Conteúdo copiado.");
    setTimeout(() => setCopied(false), 1500);
  }

  function handleApprove() {
    startTransition(async () => {
      await approveContent(contentId);
      toast.success("Conteúdo aprovado.");
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectContent(contentId);
      toast.success("Conteúdo rejeitado.");
      router.refresh();
    });
  }

  function handleRequestAdjustment() {
    startTransition(async () => {
      await requestContentAdjustment(contentId);
      toast.info("Ajuste solicitado.");
      router.refresh();
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveContent(contentId);
      toast.success("Conteúdo arquivado.");
      router.refresh();
    });
  }

  function handleMarkPublished() {
    startTransition(async () => {
      try {
        await markContentAsPublished(contentId);
        toast.success("Conteúdo marcado como publicado.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível marcar como publicado.");
      }
    });
  }

  function handleSaveEdit() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(editValue);
    } catch {
      toast.error("JSON inválido — corrija antes de salvar.");
      return;
    }
    startTransition(async () => {
      await updateContent(contentId, { content: parsed });
      toast.success("Conteúdo atualizado.");
      setOpen(false);
      router.refresh();
    });
  }

  function handleSaveComment() {
    if (!commentValue.trim()) {
      toast.error("Escreva um comentário antes de salvar.");
      return;
    }
    startTransition(async () => {
      await addContentComment(contentId, commentValue);
      toast.success("Comentário salvo.");
      setCommentValue("");
      router.refresh();
    });
  }

  function handleSendBackToAgent() {
    if (!commentValue.trim()) {
      toast.error("Escreva as instruções para o redator antes de enviar.");
      return;
    }
    startTransition(async () => {
      try {
        await sendContentBackToAgent(contentId, commentValue);
        toast.success("Conteúdo enviado para o redator corrigir.");
        setCommentValue("");
        setCommentsOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível enviar para o redator.");
      }
    });
  }

  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
  const canSendBack = !status || SENDABLE_BACK_STATUSES.has(status);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        Copiar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
          <Pencil className="size-3.5" />
          Editar
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar conteúdo</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="min-h-64 font-mono text-xs"
          />
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sortedVersions.length > 0 && (
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
            <History className="size-3.5" />
            Histórico ({sortedVersions.length})
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Histórico de versões</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {sortedVersions.map((version) => (
                <details key={version.versionNumber} className="rounded-lg border border-border p-2.5 text-sm">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-1.5">
                    <span className="font-medium">Versão {version.versionNumber}</span>
                    <Badge variant="outline">{VERSION_SOURCE_LABEL[version.source] ?? version.source}</Badge>
                    {version.usedFallback && <Badge variant="outline">Simulado</Badge>}
                    <span className="text-xs text-muted-foreground">{formatDateTime(version.createdAt)}</span>
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {JSON.stringify(version.contentData, null, 2)}
                  </pre>
                </details>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
          <MessageSquare className="size-3.5" />
          Comentários ({comments.length})
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Comentários</DialogTitle>
          </DialogHeader>
          {comments.length > 0 && (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-border p-2.5 text-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{comment.authorName}</span>
                    <span>{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
          <Textarea
            value={commentValue}
            onChange={(e) => setCommentValue(e.target.value)}
            placeholder="Escreva um comentário ou instruções de correção..."
            className="min-h-24 text-sm"
          />
          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <Button variant="outline" onClick={handleSaveComment} disabled={isPending}>
              Salvar comentário
            </Button>
            <Button onClick={handleSendBackToAgent} disabled={isPending || !canSendBack} className="gap-1.5">
              <Send className="size-3.5" />
              Enviar para o redator
            </Button>
          </DialogFooter>
          {!canSendBack && (
            <p className="text-xs text-muted-foreground">
              Este conteúdo não pode ser enviado ao redator no status atual.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleApprove} disabled={isPending}>
        <ThumbsUp className="size-3.5" />
        Aprovar
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReject} disabled={isPending}>
        <ThumbsDown className="size-3.5" />
        Rejeitar
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRequestAdjustment} disabled={isPending}>
        <RotateCcw className="size-3.5" />
        Solicitar ajuste
      </Button>
      {(status === "APPROVED" || status === "SCHEDULED") && (
        <ScheduleDialog
          contentId={contentId}
          triggerLabel={status === "SCHEDULED" ? "Reagendar" : "Agendar"}
          defaultDate={scheduledAt}
        />
      )}
      {status === "SCHEDULED" && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleMarkPublished} disabled={isPending}>
          <CheckCircle2 className="size-3.5" />
          Marcar como publicado
        </Button>
      )}
      {showArchive && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleArchive} disabled={isPending}>
          <Archive className="size-3.5" />
          Arquivar
        </Button>
      )}
    </div>
  );
}
