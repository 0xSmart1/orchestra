-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_memory_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "agentId" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "filePath" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "memory_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "memory_documents_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_instances" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_memory_documents" ("agentId", "createdAt", "filePath", "id", "lastSummary", "projectId", "type", "updatedAt", "version") SELECT "agentId", "createdAt", "filePath", "id", "lastSummary", "projectId", "type", "updatedAt", "version" FROM "memory_documents";
DROP TABLE "memory_documents";
ALTER TABLE "new_memory_documents" RENAME TO "memory_documents";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
