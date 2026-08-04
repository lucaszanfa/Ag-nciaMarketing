-- AlterTable
ALTER TABLE "GeneratedContent" ADD COLUMN "publishedAt" DATETIME;
ALTER TABLE "GeneratedContent" ADD COLUMN "scheduledAt" DATETIME;

-- CreateIndex
CREATE INDEX "GeneratedContent_scheduledAt_idx" ON "GeneratedContent"("scheduledAt");
