-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL DEFAULT 9,
    "yearGroup" INTEGER NOT NULL DEFAULT 5,
    "avatar" TEXT NOT NULL DEFAULT '🐣',
    "tutorName" TEXT NOT NULL DEFAULT 'Maths Bot',
    "hobbies" TEXT,
    "pets" TEXT,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastSprintDate" DATETIME
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yearGroup" INTEGER NOT NULL DEFAULT 5,
    "masteryLevel" REAL NOT NULL DEFAULT 0.0,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 3,
    "nextReviewDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Topic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "questionText" TEXT,
    "userAnswer" TEXT,
    "correctAnswer" TEXT,
    "misconception" TEXT,
    "advice" TEXT,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionHistory_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_yearGroup_userId_key" ON "Topic"("name", "yearGroup", "userId");
