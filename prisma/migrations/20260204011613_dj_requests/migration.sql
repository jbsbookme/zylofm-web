-- CreateTable
CREATE TABLE "DJRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reviewedAt" DATETIME,
    CONSTRAINT "DJRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DJRequest_userId_status_idx" ON "DJRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "DJRequest_createdAt_idx" ON "DJRequest"("createdAt");
