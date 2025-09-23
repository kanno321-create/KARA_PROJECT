-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "defaultBrand" TEXT NOT NULL DEFAULT 'SANGDO',
    "defaultForm" TEXT NOT NULL DEFAULT 'ECONOMIC',
    "defaultLocation" TEXT NOT NULL DEFAULT 'INDOOR',
    "defaultMount" TEXT NOT NULL DEFAULT 'FLUSH',
    "rules" JSONB NOT NULL,
    "knowledgeVersion" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "installation" JSONB NOT NULL,
    "device" JSONB NOT NULL,
    "main" JSONB NOT NULL,
    "branches" JSONB NOT NULL,
    "accessories" JSONB NOT NULL,
    "enclosure" JSONB,
    "evidenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimateId" TEXT NOT NULL,
    "rulesDoc" TEXT NOT NULL,
    "tables" JSONB NOT NULL,
    "brandPolicy" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "version" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Abstain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimateId" TEXT,
    "requestPath" TEXT NOT NULL,
    "missingData" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolution" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "Abstain_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "location" TEXT,
    "memo" TEXT,
    "owner" TEXT,
    "links" JSONB,
    "conflicts" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "to" TEXT,
    "cc" TEXT,
    "subject" TEXT,
    "body" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "attachments" JSONB,
    "groupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailThread_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "EmailGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Drawing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rev" TEXT NOT NULL,
    "date" DATETIME,
    "author" TEXT,
    "tags" JSONB,
    "memo" TEXT,
    "history" JSONB,
    "links" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "KnowledgeTable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_evidenceId_key" ON "Estimate"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_estimateId_key" ON "Evidence"("estimateId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailGroup_name_key" ON "EmailGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Drawing_name_rev_key" ON "Drawing"("name", "rev");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeTable_name_key" ON "KnowledgeTable"("name");
