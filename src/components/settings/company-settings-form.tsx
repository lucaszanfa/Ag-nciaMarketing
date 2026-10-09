"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSettings } from "@/server/actions/settings.actions";
import type { CompanySettings } from "@/generated/prisma/client";
import type { SettingsSectionId } from "./settings-layout";

function toCsv(value: unknown): string {
  return Array.isArray(value) ? value.join(", ") : "";
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function socialValue(social: unknown, key: string): string {
  if (social && typeof social === "object" && key in social) {
    return String((social as Record<string, unknown>)[key] ?? "");
  }
  return "";
}

export function CompanySettingsForm({
  settings,
  activeSection,
}: {
  settings: CompanySettings;
  activeSection: SettingsSectionId;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    companyName: settings.companyName,
    description: settings.description ?? "",
    industry: settings.industry ?? "",
    products: toCsv(settings.products),
    services: toCsv(settings.services),
    targetAudience: settings.targetAudience ?? "",
    toneOfVoice: settings.toneOfVoice ?? "",
    objectives: toCsv(settings.objectives),
    preferredTerms: toCsv(settings.preferredTerms),
    forbiddenTerms: toCsv(settings.forbiddenTerms),
    allowedTopics: toCsv(settings.allowedTopics),
    forbiddenTopics: toCsv(settings.forbiddenTopics),
    defaultCta: settings.defaultCta ?? "",
    hashtags: toCsv(settings.hashtags),
    website: settings.website ?? "",
    linkedin: socialValue(settings.socialNetworks, "linkedin"),
    instagram: socialValue(settings.socialNetworks, "instagram"),
    facebook: socialValue(settings.socialNetworks, "facebook"),
    logoUrl: settings.logoUrl ?? "",
    colors: toCsv(settings.colors),
    visualGuidelines: settings.visualGuidelines ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const socialNetworks: Record<string, string> = {};
    if (form.linkedin) socialNetworks.linkedin = form.linkedin;
    if (form.instagram) socialNetworks.instagram = form.instagram;
    if (form.facebook) socialNetworks.facebook = form.facebook;

    startTransition(async () => {
      await updateSettings({
        companyName: form.companyName,
        description: form.description,
        industry: form.industry,
        products: fromCsv(form.products),
        services: fromCsv(form.services),
        targetAudience: form.targetAudience,
        toneOfVoice: form.toneOfVoice,
        objectives: fromCsv(form.objectives),
        preferredTerms: fromCsv(form.preferredTerms),
        forbiddenTerms: fromCsv(form.forbiddenTerms),
        allowedTopics: fromCsv(form.allowedTopics),
        forbiddenTopics: fromCsv(form.forbiddenTopics),
        defaultCta: form.defaultCta,
        hashtags: fromCsv(form.hashtags),
        website: form.website,
        socialNetworks,
        logoUrl: form.logoUrl,
        colors: fromCsv(form.colors),
        visualGuidelines: form.visualGuidelines,
      });
      toast.success("Configurações salvas.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card className={activeSection === "identidade" ? "" : "hidden"}>
        <CardHeader>
          <CardTitle className="text-base">Identidade da empresa</CardTitle>
          <CardDescription>Como a empresa se descreve — a base do que os agentes sabem sobre ela.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome da empresa</Label>
            <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Segmento</Label>
            <Input value={form.industry} onChange={(e) => set("industry", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Produtos (separados por vírgula)</Label>
            <Input value={form.products} onChange={(e) => set("products", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Serviços (separados por vírgula)</Label>
            <Input value={form.services} onChange={(e) => set("services", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className={activeSection === "publico" ? "" : "hidden"}>
        <CardHeader>
          <CardTitle className="text-base">Público e tom de voz</CardTitle>
          <CardDescription>Para quem a marca fala e como ela soa nos conteúdos gerados.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Público-alvo</Label>
            <Textarea value={form.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tom de voz</Label>
            <Input value={form.toneOfVoice} onChange={(e) => set("toneOfVoice", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>CTA padrão</Label>
            <Input value={form.defaultCta} onChange={(e) => set("defaultCta", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Objetivos (separados por vírgula)</Label>
            <Input value={form.objectives} onChange={(e) => set("objectives", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className={activeSection === "diretrizes" ? "" : "hidden"}>
        <CardHeader>
          <CardTitle className="text-base">Diretrizes de conteúdo</CardTitle>
          <CardDescription>Palavras e temas para o Revisor aprovar ou barrar automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Palavras preferidas</Label>
            <Input value={form.preferredTerms} onChange={(e) => set("preferredTerms", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Palavras proibidas</Label>
            <Input value={form.forbiddenTerms} onChange={(e) => set("forbiddenTerms", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Temas principais</Label>
            <Input value={form.allowedTopics} onChange={(e) => set("allowedTopics", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Temas a evitar</Label>
            <Input value={form.forbiddenTopics} onChange={(e) => set("forbiddenTopics", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Hashtags padrão</Label>
            <Input value={form.hashtags} onChange={(e) => set("hashtags", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className={activeSection === "visual" ? "" : "hidden"}>
        <CardHeader>
          <CardTitle className="text-base">Site, redes sociais e identidade visual</CardTitle>
          <CardDescription>Links e referências visuais usados nos briefings e nas peças geradas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Site</Label>
            <Input value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Logo (URL)</Label>
            <Input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>LinkedIn</Label>
            <Input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Instagram</Label>
            <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Facebook</Label>
            <Input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cores da marca (separadas por vírgula)</Label>
            <Input value={form.colors} onChange={(e) => set("colors", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Orientações visuais</Label>
            <Textarea value={form.visualGuidelines} onChange={(e) => set("visualGuidelines", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          Salvar configurações
        </Button>
      </div>
    </form>
  );
}
