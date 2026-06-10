/*
  Warnings:

  - Added the required column `userId` to the `Topic` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yearGroup" INTEGER NOT NULL DEFAULT 5,
    "masteryLevel" REAL NOT NULL DEFAULT 0.0,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 3,
    "nextReviewDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Topic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Topic" ("difficultyLevel", "id", "masteryLevel", "name", "nextReviewDate", "yearGroup") SELECT "difficultyLevel", "id", "masteryLevel", "name", "nextReviewDate", "yearGroup" FROM "Topic";
DROP TABLE "Topic";
ALTER TABLE "new_Topic" RENAME TO "Topic";
CREATE UNIQUE INDEX "Topic_name_yearGroup_userId_key" ON "Topic"("name", "yearGroup", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
