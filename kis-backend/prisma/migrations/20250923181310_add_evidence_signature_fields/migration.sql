/*
  Warnings:

  - Added the required column `knowledgeVersion` to the `Evidence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rulesVersion` to the `Evidence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature` to the `Evidence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `snapshotHash` to the `Evidence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tableHashes` to the `Evidence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usedRows` to the `Evidence` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimateId" TEXT NOT NULL,
    "rulesDoc" TEXT NOT NULL,
    "tables" JSONB NOT NULL,
    "brandPolicy" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "snapshotHash" TEXT NOT NULL,
    "rulesVersion" TEXT NOT NULL,
    "knowledgeVersion" TEXT NOT NULL,
    "usedRows" JSONB NOT NULL,
    "tableHashes" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "version" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Evidence" ("brandPolicy", "createdAt", "estimateId", "id", "rulesDoc", "snapshot", "tables", "version") SELECT "brandPolicy", "createdAt", "estimateId", "id", "rulesDoc", "snapshot", "tables", "version" FROM "Evidence";
DROP TABLE "Evidence";
ALTER TABLE "new_Evidence" RENAME TO "Evidence";
CREATE UNIQUE INDEX "Evidence_estimateId_key" ON "Evidence"("estimateId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
