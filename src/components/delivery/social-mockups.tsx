"use client";

import { useState, type ReactNode } from "react";
import {
  Bookmark,
  Camera,
  ChevronLeft,
  ChevronRight,
  Globe,
  Heart,
  ImageIcon,
  Link2,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Music2,
  Repeat2,
  Send,
  ThumbsUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyBrand } from "@/lib/social";

/*
 * Visual mockups of how each piece will look once published. They intentionally use fixed,
 * light "app" colors (not the studio theme) so they read like a screenshot of the real
 * LinkedIn / Instagram interface in both light and dark mode.
 */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function handleOf(company: CompanyBrand): string {
  return company.instagramHandle || initials(company.name).toLowerCase();
}

function BrandAvatar({ company, className, rounded = "full" }: { company: CompanyBrand; className?: string; rounded?: "full" | "md" }) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-md";
  return company.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={company.logoUrl} alt={company.name} className={cn("shrink-0 bg-[#0b2545] object-contain p-[2px]", radius, className)} />
  ) : (
    <div className={cn("flex shrink-0 items-center justify-center bg-[#0b2545] text-[10px] font-semibold text-white", radius, className)}>
      {initials(company.name)}
    </div>
  );
}

/** Renders text keeping line breaks and coloring #hashtags like the real apps do. */
function RichText({ text, hashtagClass }: { text: string; hashtagClass: string }) {
  const parts = text.split(/(#[\p{L}\p{N}_]+)/gu);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <span key={i} className={hashtagClass}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function ImagePlaceholder({ suggestion, className }: { suggestion?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 bg-neutral-100 p-6 text-center text-neutral-500", className)}>
      <ImageIcon className="size-6" />
      <p className="text-xs font-medium">Imagem ainda não gerada</p>
      {suggestion && <p className="line-clamp-3 max-w-sm text-[11px] italic">{suggestion}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// LinkedIn
// ---------------------------------------------------------------------------------------------

export function LinkedInPostMockup({
  company,
  text,
  imageUrl,
  visualSuggestion,
}: {
  company: CompanyBrand;
  text: string;
  imageUrl?: string | null;
  visualSuggestion?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 210 || text.split("\n").length > 3;

  return (
    <div className="w-full max-w-[555px] overflow-hidden rounded-lg border border-neutral-200 bg-white font-sans text-neutral-900 shadow-sm">
      <div className="flex items-start gap-2 px-4 pt-3">
        <BrandAvatar company={company} rounded="md" className="size-12 border border-neutral-200 p-1.5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight font-semibold">{company.name}</p>
          <p className="truncate text-xs leading-tight text-neutral-500">Página da empresa</p>
          <p className="flex items-center gap-1 text-xs leading-tight text-neutral-500">
            Agora • <Globe className="size-3" />
          </p>
        </div>
        <span className="pt-0.5 text-sm font-semibold text-[#0a66c2]">+ Seguir</span>
        <MoreHorizontal className="mt-0.5 size-5 text-neutral-600" />
      </div>

      <div className="px-4 pt-2 pb-2 text-sm leading-[1.45]">
        <p className={cn("whitespace-pre-wrap", !expanded && isLong && "line-clamp-3")}>
          <RichText text={text} hashtagClass="font-semibold text-[#0a66c2]" />
        </p>
        {isLong && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-0.5 text-sm text-neutral-500 hover:text-[#0a66c2] hover:underline">
            {expanded ? "...menos" : "...mais"}
          </button>
        )}
      </div>

      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={visualSuggestion ?? ""} className="aspect-[1.91/1] w-full object-cover" />
      ) : (
        <ImagePlaceholder suggestion={visualSuggestion} className="aspect-[1.91/1] w-full" />
      )}

      <div className="mx-4 flex items-center gap-1 border-b border-neutral-200 py-2 text-xs text-neutral-500">
        <span className="flex size-4 items-center justify-center rounded-full bg-[#378fe9]">
          <ThumbsUp className="size-2.5 fill-white text-white" />
        </span>
        Seja o primeiro a reagir
      </div>
      <div className="grid grid-cols-4 px-2 py-1 text-xs font-semibold text-neutral-600">
        {[
          { icon: <ThumbsUp className="size-4" />, label: "Gostei" },
          { icon: <MessageSquare className="size-4" />, label: "Comentar" },
          { icon: <Repeat2 className="size-4" />, label: "Compartilhar" },
          { icon: <Send className="size-4" />, label: "Enviar" },
        ].map((a) => (
          <span key={a.label} className="flex items-center justify-center gap-1.5 rounded py-2.5">
            {a.icon}
            <span className="hidden sm:inline">{a.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Instagram — shared pieces
// ---------------------------------------------------------------------------------------------

function StoryRingAvatar({ company, size = "size-8" }: { company: CompanyBrand; size?: string }) {
  return (
    <span className="rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] p-[2px]">
      <span className="block rounded-full bg-white p-[2px]">
        <BrandAvatar company={company} className={size} />
      </span>
    </span>
  );
}

function InstagramCaption({ handle, text }: { handle: string; text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 125 || text.split("\n").length > 2;
  return (
    <div className="text-sm leading-[1.35]">
      <p className={cn("whitespace-pre-wrap", !expanded && isLong && "line-clamp-2")}>
        <span className="mr-1 font-semibold">{handle}</span>
        <RichText text={text} hashtagClass="text-[#00376b]" />
      </p>
      {isLong && !expanded && (
        <button type="button" onClick={() => setExpanded(true)} className="text-sm text-neutral-500">
          mais
        </button>
      )}
    </div>
  );
}

export interface CarouselSlide {
  title?: string;
  text: string;
}

/** A designed carousel slide, used when there is no final artwork yet. */
function SlideArt({ slide, index, total, company, isCover, showCounter = true }: { slide: CarouselSlide; index: number; total: number; company: CompanyBrand; isCover: boolean; showCounter?: boolean }) {
  return (
    <div className="relative flex aspect-square w-full flex-col justify-between bg-gradient-to-br from-[#0b2545] via-[#134074] to-[#13a89e] px-11 py-7 text-white">
      <div className="flex items-center justify-between text-[11px] font-medium tracking-wide uppercase opacity-80">
        <span className="flex items-center gap-1.5">
          <BrandAvatar company={company} className="size-5" />
          {company.name}
        </span>
        {showCounter && total > 1 && (
          <span>
            {index + 1}/{total}
          </span>
        )}
      </div>
      <div className={cn("flex flex-col gap-3", isCover && "items-start")}>
        {slide.title && (
          <p className={cn("leading-tight font-bold text-balance", isCover ? "text-3xl" : "text-xl")}>{slide.title}</p>
        )}
        <p className={cn("leading-snug text-pretty opacity-95", isCover ? "text-lg" : "text-[15px]")}>{slide.text}</p>
      </div>
      <div className="flex justify-end text-[11px] font-medium opacity-80">{index < total - 1 ? "Arraste para o lado →" : "Fale com a gente"}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Instagram feed (single post or carousel)
// ---------------------------------------------------------------------------------------------

export function InstagramFeedMockup({
  company,
  caption,
  imageUrl,
  visualSuggestion,
  slides,
}: {
  company: CompanyBrand;
  caption: string;
  imageUrl?: string | null;
  visualSuggestion?: string;
  /** When present, renders a swipeable carousel (first slide = cover). */
  slides?: CarouselSlide[];
}) {
  const [index, setIndex] = useState(0);
  const handle = handleOf(company);
  const isCarousel = !!slides && slides.length > 1;
  const total = slides?.length ?? 1;

  return (
    <div className="w-full max-w-[470px] overflow-hidden rounded-lg border border-neutral-200 bg-white font-sans text-neutral-900 shadow-sm">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <StoryRingAvatar company={company} />
        <p className="flex-1 truncate text-sm font-semibold">
          {handle} <span className="font-normal text-neutral-500">•</span>{" "}
          <span className="text-[#0095f6]">Seguir</span>
        </p>
        <MoreHorizontal className="size-5" />
      </div>

      <div className="relative">
        {isCarousel ? (
          <>
            {index === 0 && imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={visualSuggestion ?? ""} className="aspect-square w-full object-cover" />
            ) : (
              <SlideArt slide={slides![index]} index={index} total={total} company={company} isCover={index === 0} showCounter={false} />
            )}
            <span className="absolute top-3 right-3 rounded-full bg-neutral-900/70 px-2 py-0.5 text-xs font-medium text-white">
              {index + 1}/{total}
            </span>
            {index > 0 && (
              <button type="button" aria-label="Slide anterior" onClick={() => setIndex(index - 1)} className="absolute top-1/2 left-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow">
                <ChevronLeft className="size-4" />
              </button>
            )}
            {index < total - 1 && (
              <button type="button" aria-label="Próximo slide" onClick={() => setIndex(index + 1)} className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow">
                <ChevronRight className="size-4" />
              </button>
            )}
          </>
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={visualSuggestion ?? ""} className="aspect-square w-full object-cover" />
        ) : slides?.[0] ? (
          <SlideArt slide={slides[0]} index={0} total={1} company={company} isCover />
        ) : (
          <ImagePlaceholder suggestion={visualSuggestion} className="aspect-square w-full" />
        )}
      </div>

      <div className="relative flex items-center gap-4 px-3 pt-3 pb-1">
        <Heart className="size-6" />
        <MessageCircle className="size-6 -scale-x-100" />
        <Send className="size-6" />
        {isCarousel && (
          <div className="absolute left-1/2 flex -translate-x-1/2 gap-1">
            {slides!.map((_, i) => (
              <span key={i} className={cn("size-1.5 rounded-full", i === index ? "bg-[#0095f6]" : "bg-neutral-300")} />
            ))}
          </div>
        )}
        <Bookmark className="ml-auto size-6" />
      </div>

      <div className="flex flex-col gap-1 px-3 pt-1 pb-3">
        <p className="text-sm font-semibold">Seja o primeiro a curtir</p>
        <InstagramCaption handle={handle} text={caption} />
        <p className="text-[10px] tracking-wide text-neutral-500 uppercase">Agora mesmo</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Vertical (9:16) frame shared by Reels and Stories
// ---------------------------------------------------------------------------------------------

function VerticalFrame({ imageUrl, children, onPrev, onNext }: { imageUrl?: string | null; children: ReactNode; onPrev?: () => void; onNext?: () => void }) {
  return (
    <div className="relative aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-[1.75rem] border-[6px] border-neutral-900 bg-neutral-900 font-sans text-white shadow-lg">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#134074] via-[#0b2545] to-[#13a89e]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      {/* Tap zones like the real app: left half goes back, right half goes forward. */}
      {onPrev && <button type="button" aria-label="Anterior" onClick={onPrev} className="absolute inset-y-0 left-0 z-10 w-1/3" />}
      {onNext && <button type="button" aria-label="Próximo" onClick={onNext} className="absolute inset-y-0 right-0 z-10 w-1/3" />}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Reels
// ---------------------------------------------------------------------------------------------

export interface ReelsScene {
  moment: string;
  onScreenText: string;
  narration?: string;
}

export function InstagramReelsMockup({
  company,
  caption,
  imageUrl,
  scenes,
}: {
  company: CompanyBrand;
  caption: string;
  imageUrl?: string | null;
  scenes: ReelsScene[];
}) {
  const [index, setIndex] = useState(0);
  const handle = handleOf(company);
  const scene = scenes[index];

  return (
    <div className="flex flex-col items-center gap-3">
      <VerticalFrame
        imageUrl={imageUrl}
        onPrev={index > 0 ? () => setIndex(index - 1) : undefined}
        onNext={index < scenes.length - 1 ? () => setIndex(index + 1) : undefined}
      >
        <div className="flex items-center justify-between px-4 pt-3 text-base font-semibold">
          Reels
          <Camera className="size-5" />
        </div>

        {scene && (
          <div className="absolute inset-x-12 top-[38%] -translate-y-1/2 text-center">
            <span className="box-decoration-clone rounded-md bg-white px-2 py-1 text-[15px] leading-relaxed font-semibold text-neutral-900">
              {scene.onScreenText}
            </span>
          </div>
        )}

        <div className="absolute right-2.5 bottom-20 flex flex-col items-center gap-4 text-[11px]">
          <span className="flex flex-col items-center gap-0.5"><Heart className="size-6" />Curtir</span>
          <span className="flex flex-col items-center gap-0.5"><MessageCircle className="size-6 -scale-x-100" />0</span>
          <span className="flex flex-col items-center gap-0.5"><Send className="size-6" /></span>
          <MoreHorizontal className="size-5" />
        </div>

        <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1.5 pr-10">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BrandAvatar company={company} className="size-7 border border-white/60" />
            {handle}
            <span className="rounded-md border border-white/70 px-2 py-0.5 text-xs">Seguir</span>
          </div>
          <p className="line-clamp-1 text-xs opacity-95">{caption}</p>
          <p className="flex items-center gap-1 text-[11px] opacity-90">
            <Music2 className="size-3" /> {handle} · Áudio original
          </p>
        </div>
      </VerticalFrame>

      {scenes.length > 1 && (
        <div className="flex w-full max-w-[300px] gap-1">
          {scenes.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              title={s.moment}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", i === index ? "bg-primary" : "bg-muted-foreground/25 hover:bg-muted-foreground/50")}
            />
          ))}
        </div>
      )}
      {scene && (
        <p className="max-w-[300px] text-center text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Cena {index + 1} · {scene.moment}</span>
          {scene.narration && <> — “{scene.narration}”</>}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------------------------

export interface StoryScreen {
  text: string;
  interactionType?: string;
}

function StorySticker({ type, cta }: { type: string; cta: string }) {
  const t = type.toLowerCase();
  if (/enquete|poll|vota/.test(t)) {
    return (
      <div className="w-48 overflow-hidden rounded-xl bg-white text-sm font-semibold text-neutral-900 shadow-lg">
        <div className="border-b border-neutral-200 py-2.5 text-center text-[#2f80ed]">SIM</div>
        <div className="py-2.5 text-center text-[#eb5757]">NÃO</div>
      </div>
    );
  }
  if (/pergunta|question|caixa/.test(t)) {
    return (
      <div className="w-52 overflow-hidden rounded-xl bg-white text-center shadow-lg">
        <p className="bg-gradient-to-r from-[#d62976] to-[#fa7e1e] px-3 py-2 text-xs font-semibold text-white">Faça uma pergunta</p>
        <p className="px-3 py-3 text-xs text-neutral-400">Digite algo...</p>
      </div>
    );
  }
  if (/slider|emoji|escala/.test(t)) {
    return (
      <div className="w-48 rounded-xl bg-white px-4 py-3 shadow-lg">
        <div className="relative h-1.5 rounded-full bg-gradient-to-r from-[#feda75] to-[#d62976]">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xl">⚡</span>
        </div>
      </div>
    );
  }
  if (/contagem|countdown|regressiva/.test(t)) {
    return (
      <div className="w-48 rounded-xl bg-gradient-to-br from-[#4f5bd5] to-[#962fbf] px-4 py-3 text-center shadow-lg">
        <p className="text-[11px] font-semibold uppercase">Contagem regressiva</p>
        <p className="mt-1 font-mono text-lg font-bold">02 : 14 : 30</p>
      </div>
    );
  }
  if (/quiz|teste/.test(t)) {
    return (
      <div className="w-52 space-y-1.5 rounded-xl bg-white p-3 text-xs font-semibold text-neutral-800 shadow-lg">
        {["A", "B", "C"].map((o) => (
          <div key={o} className="rounded-full border border-neutral-200 px-3 py-1.5">{o}</div>
        ))}
      </div>
    );
  }
  if (/link|saiba|cta/.test(t)) {
    return (
      <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#0095f6] uppercase shadow-lg">
        <Link2 className="size-4" />
        {cta.length > 28 ? "Saiba mais" : cta}
      </span>
    );
  }
  return null;
}

export function InstagramStoryMockup({
  company,
  screens,
  cta,
  imageUrl,
}: {
  company: CompanyBrand;
  screens: StoryScreen[];
  cta: string;
  imageUrl?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const handle = handleOf(company);
  const screen = screens[index];
  const isLast = index === screens.length - 1;

  return (
    <div className="flex flex-col items-center gap-2">
      <VerticalFrame
        imageUrl={imageUrl}
        onPrev={index > 0 ? () => setIndex(index - 1) : undefined}
        onNext={!isLast ? () => setIndex(index + 1) : undefined}
      >
        <div className="flex gap-1 px-2 pt-2">
          {screens.map((_, i) => (
            <span key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
              <span className={cn("block h-full bg-white", i <= index ? "w-full" : "w-0")} />
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 pt-2 text-sm font-semibold">
          <BrandAvatar company={company} className="size-7" />
          {handle}
          <span className="text-xs font-normal opacity-80">agora</span>
          <MoreHorizontal className="ml-auto size-5" />
          <X className="size-5" />
        </div>

        {screen && (
          <div className="absolute inset-x-6 top-[30%] flex flex-col items-center gap-5 text-center">
            <p className="text-xl leading-snug font-bold text-balance [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">{screen.text}</p>
            {screen.interactionType && <StorySticker type={screen.interactionType} cta={cta} />}
            {isLast && !screen.interactionType && (
              <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#0095f6] uppercase shadow-lg">
                <Link2 className="size-4" />
                Saiba mais
              </span>
            )}
          </div>
        )}

        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3">
          <span className="flex-1 rounded-full border border-white/70 px-4 py-2 text-xs opacity-90">Enviar mensagem</span>
          <Heart className="size-6" />
          <Send className="size-6" />
        </div>
      </VerticalFrame>
      <p className="text-xs text-muted-foreground">
        Tela {index + 1} de {screens.length}
        {screen?.interactionType ? ` · figurinha: ${screen.interactionType}` : ""} · toque nas laterais para navegar
      </p>
    </div>
  );
}
