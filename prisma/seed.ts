import { prisma } from "@/lib/prisma";
import { runWorkflow } from "@/services/workflow/workflow-runner";
import { hashPassword } from "@/lib/password";

// A separate demo account, distinct from any real login — this seed only
// ever creates/refreshes its own demo data, never a real user's account.
const ADMIN_EMAIL = "admin@marketingaistudio.local";
const ADMIN_PASSWORD = "demo12345";

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: "Administrador (demo)",
      email: ADMIN_EMAIL,
      password: await hashPassword(ADMIN_PASSWORD),
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  await prisma.companySettings.deleteMany();
  await prisma.companySettings.create({
    data: {
      companyName: "Nimbus Tecnologia",
      description: "Empresa de software B2B especializada em automação de processos financeiros.",
      industry: "Tecnologia / SaaS B2B",
      products: ["Nimbus Financeiro", "Nimbus Conciliação", "Nimbus API"],
      services: ["Implantação", "Suporte dedicado", "Consultoria de processos"],
      targetAudience: "Diretores financeiros e controllers de médias e grandes empresas",
      toneOfVoice: "Consultivo, direto e confiável",
      objectives: ["Gerar autoridade no setor financeiro", "Aumentar geração de leads qualificados"],
      preferredTerms: ["automação", "eficiência", "transparência"],
      forbiddenTerms: ["barato", "milagre"],
      allowedTopics: ["automação financeira", "compliance", "produtividade de equipes"],
      forbiddenTopics: ["política", "concorrentes diretos"],
      defaultCta: "Agende uma demonstração gratuita",
      hashtags: ["#NimbusTecnologia", "#AutomacaoFinanceira", "#GestaoFinanceira"],
      website: "https://nimbus.example.com",
      socialNetworks: {
        linkedin: "https://linkedin.com/company/nimbus",
        instagram: "https://instagram.com/nimbus",
      },
      colors: ["#0F172A", "#2563EB", "#F8FAFC"],
      visualGuidelines:
        "Usar sempre fundo escuro com destaques em azul; evitar imagens genéricas de banco de imagens.",
    },
  });

  // Repeatable seeding: clear this admin's projects before recreating them.
  await prisma.project.deleteMany({ where: { createdById: admin.id } });

  // Project 1 — DRAFT, just submitted, workflow not started yet.
  await prisma.project.create({
    data: {
      title: "Calendário semanal de conteúdo",
      originalRequest:
        "Quero um calendário de conteúdo para a próxima semana, com posts educativos para LinkedIn e Instagram.",
      status: "DRAFT",
      createdById: admin.id,
      workflowExecution: { create: { status: "DRAFT" } },
    },
  });

  // Project 2 — RUNNING, partway through the agent flow.
  const runningProject = await prisma.project.create({
    data: {
      title: "Campanha de lançamento — Nimbus API",
      originalRequest:
        "Quero uma campanha para o lançamento do nosso novo produto, a Nimbus API, voltada para times de engenharia e financeiro.",
      status: "RUNNING",
      progress: 45,
      createdById: admin.id,
      workflowExecution: {
        create: { status: "RUNNING", currentAgent: "LINKEDIN_WRITER", progress: 45, startedAt: new Date() },
      },
    },
  });

  const chiefPlan = {
    objective: "Lançar a Nimbus API para times de engenharia e financeiro, gerando pipeline qualificado.",
    targetAudience: "Líderes de engenharia e financeiro em médias e grandes empresas",
    channels: ["LINKEDIN", "INSTAGRAM", "GENERAL"],
    formatsBreakdown: [
      { format: "LinkedIn — posts", quantity: 4 },
      { format: "Instagram — carrossel", quantity: 1 },
      { format: "Instagram — Reels", quantity: 1 },
      { format: "Campanha institucional", quantity: 1 },
    ],
    totalContentCount: 7,
    durationWeeks: 3,
    recommendedTone: "Consultivo, direto e confiável",
    keyThemes: ["Automação financeira", "Integração via API", "Cases de sucesso de clientes"],
    cta: "Agende uma demonstração gratuita",
    workDistribution: [
      { agent: "LINKEDIN_WRITER", description: "Produzir 4 posts para LinkedIn" },
      { agent: "INSTAGRAM_WRITER", description: "Produzir 1 carrossel e 1 roteiro de Reels" },
      { agent: "CAMPAIGN_WRITER", description: "Estruturar a campanha institucional de lançamento" },
      { agent: "REVIEWER", description: "Revisar todos os conteúdos antes da entrega final" },
    ],
  };

  await prisma.agentExecution.create({
    data: {
      projectId: runningProject.id,
      agentType: "CEO",
      status: "COMPLETED",
      progress: 100,
      currentMessage: "Solicitação enviada",
      startedAt: runningProject.createdAt,
      completedAt: runningProject.createdAt,
      input: { originalRequest: runningProject.originalRequest },
      output: { originalRequest: runningProject.originalRequest },
    },
  });

  await prisma.agentExecution.create({
    data: {
      projectId: runningProject.id,
      agentType: "CHIEF_EDITOR",
      status: "COMPLETED",
      progress: 100,
      currentMessage: "Planejamento editorial concluído",
      startedAt: new Date(),
      completedAt: new Date(),
      input: { originalRequest: runningProject.originalRequest },
      output: chiefPlan,
    },
  });

  await prisma.agentExecution.create({
    data: {
      projectId: runningProject.id,
      agentType: "LINKEDIN_WRITER",
      status: "WORKING",
      progress: 45,
      currentMessage: "Escrevendo posts para LinkedIn",
      startedAt: new Date(),
      input: chiefPlan,
    },
  });

  await prisma.projectMessage.createMany({
    data: [
      {
        projectId: runningProject.id,
        authorType: "CEO",
        agentType: "CEO",
        content: runningProject.originalRequest,
        metadata: {},
      },
      {
        projectId: runningProject.id,
        authorType: "AGENT",
        agentType: "CHIEF_EDITOR",
        content: `Planejamento criado: ${chiefPlan.objective}`,
        metadata: {},
      },
      {
        projectId: runningProject.id,
        authorType: "AGENT",
        agentType: "LINKEDIN_WRITER",
        content: "Escrevendo os posts para LinkedIn...",
        metadata: {},
      },
    ],
  });

  // Project 3 — COMPLETED, generated end-to-end through the real simulated
  // workflow so its data (agents, contents, reviews) is realistic and consistent.
  const completedProject = await prisma.project.create({
    data: {
      title: "Posicionamento no LinkedIn",
      originalRequest:
        "Quero melhorar o posicionamento da nossa empresa no LinkedIn com conteúdos de autoridade no setor financeiro.",
      status: "DRAFT",
      createdById: admin.id,
      workflowExecution: { create: { status: "DRAFT" } },
    },
  });

  await runWorkflow(completedProject.id);

  console.log("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
