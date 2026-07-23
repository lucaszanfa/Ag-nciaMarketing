-- AlterTable
ALTER TABLE "Review" ADD COLUMN "briefingAlignmentScore" INTEGER;
ALTER TABLE "Review" ADD COLUMN "correctionInstructions" JSONB;
ALTER TABLE "Review" ADD COLUMN "factualSafetyScore" INTEGER;
ALTER TABLE "Review" ADD COLUMN "format" TEXT;
ALTER TABLE "Review" ADD COLUMN "grammarScore" INTEGER;
ALTER TABLE "Review" ADD COLUMN "platform" TEXT;
ALTER TABLE "Review" ADD COLUMN "suggestedRevision" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AgentExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "workflowExecutionId" TEXT,
    "agentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentMessage" TEXT,
    "input" JSONB,
    "output" JSONB,
    "provider" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    CONSTRAINT "AgentExecution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AgentExecution" ("agentType", "completedAt", "currentMessage", "errorMessage", "id", "input", "output", "progress", "projectId", "startedAt", "status", "workflowExecutionId") SELECT "agentType", "completedAt", "currentMessage", "errorMessage", "id", "input", "output", "progress", "projectId", "startedAt", "status", "workflowExecutionId" FROM "AgentExecution";
DROP TABLE "AgentExecution";
ALTER TABLE "new_AgentExecution" RENAME TO "AgentExecution";
CREATE INDEX "AgentExecution_projectId_idx" ON "AgentExecution"("projectId");
CREATE INDEX "AgentExecution_projectId_agentType_idx" ON "AgentExecution"("projectId", "agentType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
