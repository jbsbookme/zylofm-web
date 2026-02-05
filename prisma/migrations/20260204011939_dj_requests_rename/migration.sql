/*
  Warnings:

  - You are about to drop the `DJRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DJRequest";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "DjRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reviewedAt" DATETIME,
    CONSTRAINT "DjRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DjRequest_userId_status_idx" ON "DjRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "DjRequest_createdAt_idx" ON "DjRequest"("createdAt");
