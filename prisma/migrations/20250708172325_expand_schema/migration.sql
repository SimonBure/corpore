/*
  Warnings:

  - Added the required column `category` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `muscleGroups` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `SessionExercise` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "muscleGroups" TEXT NOT NULL,
    "defaultSets" INTEGER NOT NULL,
    "defaultReps" INTEGER NOT NULL,
    "defaultRestBetweenSets" INTEGER NOT NULL,
    "defaultRestAfter" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Exercise" ("defaultReps", "defaultRestAfter", "defaultRestBetweenSets", "defaultSets", "id", "name") SELECT "defaultReps", "defaultRestAfter", "defaultRestBetweenSets", "defaultSets", "id", "name" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");
CREATE TABLE "new_Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "warmupTime" INTEGER NOT NULL,
    "isTemplate" BOOLEAN NOT NULL,
    "duration" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Session" ("date", "id", "isTemplate", "title", "warmupTime") SELECT "date", "id", "isTemplate", "title", "warmupTime" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE TABLE "new_SessionExercise" (
    "sessionId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "restBetweenSets" INTEGER NOT NULL,
    "restAfter" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "actualSets" INTEGER,
    "actualReps" TEXT,
    "weight" TEXT,

    PRIMARY KEY ("sessionId", "exerciseId"),
    CONSTRAINT "SessionExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SessionExercise" ("exerciseId", "reps", "restAfter", "restBetweenSets", "sessionId", "sets") SELECT "exerciseId", "reps", "restAfter", "restBetweenSets", "sessionId", "sets" FROM "SessionExercise";
DROP TABLE "SessionExercise";
ALTER TABLE "new_SessionExercise" RENAME TO "SessionExercise";
CREATE INDEX "SessionExercise_exerciseId_idx" ON "SessionExercise"("exerciseId");
CREATE INDEX "SessionExercise_sessionId_idx" ON "SessionExercise"("sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
