-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "yearGroup" INTEGER NOT NULL DEFAULT 5,
    "hobbies" TEXT,
    "petNames" TEXT,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastSprintDate" DATETIME
);
INSERT INTO "new_User" ("currentStreak", "hobbies", "id", "lastSprintDate", "name", "petNames") SELECT "currentStreak", "hobbies", "id", "lastSprintDate", "name", "petNames" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
