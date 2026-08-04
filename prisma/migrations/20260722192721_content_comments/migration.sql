-- CreateTable
CREATE TABLE "ContentComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generatedContentId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentComment_generatedContentId_fkey" FOREIGN KEY ("generatedContentId") REFERENCES "GeneratedContent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ContentComment_generatedContentId_idx" ON "ContentComment"("generatedContentId");
