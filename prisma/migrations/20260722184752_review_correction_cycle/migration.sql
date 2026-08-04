-- CreateTable
CREATE TABLE "GeneratedContentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generatedContentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "contentData" JSONB NOT NULL,
    "textContent" TEXT,
    "source" TEXT NOT NULL,
    "createdByAgent" TEXT,
    "revisionAttempt" INTEGER NOT NULL DEFAULT 0,
    "reviewId" TEXT,
    "changeReason" TEXT,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedContentVersion_generatedContentId_fkey" FOREIGN KEY ("generatedContentId") REFERENCES "GeneratedContent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GeneratedContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "agentExecutionId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "automaticRevisionCount" INTEGER NOT NULL DEFAULT 0,
    "maxAutomaticRevisions" INTEGER NOT NULL DEFAULT 2,
    "latestReviewDecision" TEXT,
    "revisionLimitReached" BOOLEAN NOT NULL DEFAULT false,
    "lastReviewId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneratedContent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GeneratedContent_agentExecutionId_fkey" FOREIGN KEY ("agentExecutionId") REFERENCES "AgentExecution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GeneratedContent" ("agentExecutionId", "content", "createdAt", "format", "id", "metadata", "platform", "projectId", "status", "title", "updatedAt") SELECT "agentExecutionId", "content", "createdAt", "format", "id", "metadata", "platform", "projectId", "status", "title", "updatedAt" FROM "GeneratedContent";
DROP TABLE "GeneratedContent";
ALTER TABLE "new_GeneratedContent" RENAME TO "GeneratedContent";
CREATE INDEX "GeneratedContent_projectId_idx" ON "GeneratedContent"("projectId");
CREATE INDEX "GeneratedContent_projectId_platform_idx" ON "GeneratedContent"("projectId", "platform");
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "generatedContentId" TEXT,
    "platform" TEXT,
    "format" TEXT,
    "overallScore" INTEGER NOT NULL,
    "clarityScore" INTEGER NOT NULL,
    "channelFitScore" INTEGER NOT NULL,
    "brandToneScore" INTEGER NOT NULL,
    "ctaScore" INTEGER NOT NULL,
    "grammarScore" INTEGER,
    "briefingAlignmentScore" INTEGER,
    "factualSafetyScore" INTEGER,
    "problems" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "correctionInstructions" JSONB,
    "suggestedRevision" TEXT,
    "decision" TEXT NOT NULL,
    "reviewedVersion" INTEGER NOT NULL DEFAULT 1,
    "revisionAttempt" INTEGER NOT NULL DEFAULT 0,
    "triggeredAutomaticRevision" BOOLEAN NOT NULL DEFAULT false,
    "isFinalAutomaticReview" BOOLEAN NOT NULL DEFAULT false,
    "requiresHumanDecision" BOOLEAN NOT NULL DEFAULT false,
    "canBeAutomaticallyRevised" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_generatedContentId_fkey" FOREIGN KEY ("generatedContentId") REFERENCES "GeneratedContent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("brandToneScore", "briefingAlignmentScore", "channelFitScore", "clarityScore", "correctionInstructions", "createdAt", "ctaScore", "decision", "factualSafetyScore", "format", "generatedContentId", "grammarScore", "id", "overallScore", "platform", "problems", "projectId", "suggestedRevision", "suggestions") SELECT "brandToneScore", "briefingAlignmentScore", "channelFitScore", "clarityScore", "correctionInstructions", "createdAt", "ctaScore", "decision", "factualSafetyScore", "format", "generatedContentId", "grammarScore", "id", "overallScore", "platform", "problems", "projectId", "suggestedRevision", "suggestions" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE INDEX "Review_projectId_idx" ON "Review"("projectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "GeneratedContentVersion_generatedContentId_idx" ON "GeneratedContentVersion"("generatedContentId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedContentVersion_generatedContentId_versionNumber_key" ON "GeneratedContentVersion"("generatedContentId", "versionNumber");
