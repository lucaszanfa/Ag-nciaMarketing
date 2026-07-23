"use client";

import { Button } from "@/components/ui/button";

export const SUGGESTIONS = [
  "Criar calendário de conteúdo para a próxima semana",
  "Criar campanha para lançamento de produto",
  "Criar posts para LinkedIn",
  "Criar campanha para Instagram",
  "Criar conteúdos educativos",
  "Criar uma campanha institucional",
];

export function SuggestionChips({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((suggestion) => (
        <Button
          key={suggestion}
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
