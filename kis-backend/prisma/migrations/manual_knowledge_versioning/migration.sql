-- CreateTable
CREATE TABLE "KnowledgeVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "NewKnowledgeTable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" INTEGER NOT NULL,
    "brand" TEXT NOT NULL,
    "series" TEXT,
    "model" TEXT,
    "af" INTEGER,
    "poles" TEXT NOT NULL,
    "widthMM" INTEGER NOT NULL,
    "heightMM" INTEGER NOT NULL,
    "depthMM" INTEGER NOT NULL,
    "meta" TEXT,
    "rowHash" TEXT NOT NULL,
    CONSTRAINT "NewKnowledgeTable_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "KnowledgeVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeStaging" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT,
    "format" TEXT NOT NULL,
    "payload" BLOB NOT NULL,
    "parsed" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tableHashes" TEXT NOT NULL,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "KnowledgeAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL
);

-- Rename existing KnowledgeTable to LegacyKnowledgeTable
ALTER TABLE "KnowledgeTable" RENAME TO "LegacyKnowledgeTable";

-- Create the new KnowledgeTable
ALTER TABLE "NewKnowledgeTable" RENAME TO "KnowledgeTable";

-- CreateIndex
CREATE INDEX "KnowledgeVersion_active_idx" ON "KnowledgeVersion"("active");

-- CreateIndex
CREATE INDEX "KnowledgeTable_versionId_brand_series_model_poles_idx" ON "KnowledgeTable"("versionId", "brand", "series", "model", "poles");

-- CreateIndex
CREATE INDEX "KnowledgeTable_versionId_brand_af_poles_idx" ON "KnowledgeTable"("versionId", "brand", "af", "poles");