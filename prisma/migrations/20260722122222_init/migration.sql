-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "products" JSONB NOT NULL,
    "services" JSONB NOT NULL,
    "targetAudience" TEXT,
    "toneOfVoice" TEXT,
    "objectives" JSONB NOT NULL,
    "preferredTerms" JSONB NOT NULL,
    "forbiddenTerms" JSONB NOT NULL,
    "allowedTopics" JSONB NOT NULL,
    "forbiddenTopics" JSONB NOT NULL,
    "defaultCta" TEXT,
    "hashtags" JSONB NOT NULL,
    "website" TEXT,
    "socialNetworks" JSONB NOT NULL,
    "logoUrl" TEXT,
    "colors" JSONB NOT NULL,
    "visualGuidelines" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "originalRequest" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentAgent" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    CONSTRAINT "WorkflowExecution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "workflowExecutionId" TEXT,
    "agentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentMessage" TEXT,
    "input" JSONB,
    "output" JSONB,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    CONSTRAINT "AgentExecution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneratedContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "agentExecutionId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneratedContent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GeneratedContent_agentExecutionId_fkey" FOREIGN KEY ("agentExecutionId") REFERENCES "AgentExecution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "generatedContentId" TEXT,
    "overallScore" INTEGER NOT NULL,
    "clarityScore" INTEGER NOT NULL,
    "channelFitScore" INTEGER NOT NULL,
    "brandToneScore" INTEGER NOT NULL,
    "ctaScore" INTEGER NOT NULL,
    "problems" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_generatedContentId_fkey" FOREIGN KEY ("generatedContentId") REFERENCES "GeneratedContent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "agentType" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_createdById_idx" ON "Project"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowExecution_projectId_key" ON "WorkflowExecution"("projectId");

-- CreateIndex
CREATE INDEX "AgentExecution_projectId_idx" ON "AgentExecution"("projectId");

-- CreateIndex
CREATE INDEX "AgentExecution_projectId_agentType_idx" ON "AgentExecution"("projectId", "agentType");

-- CreateIndex
CREATE INDEX "GeneratedContent_projectId_idx" ON "GeneratedContent"("projectId");

-- CreateIndex
CREATE INDEX "GeneratedContent_projectId_platform_idx" ON "GeneratedContent"("projectId", "platform");

-- CreateIndex
CREATE INDEX "Review_projectId_idx" ON "Review"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMessage_projectId_idx" ON "ProjectMessage"("projectId");
