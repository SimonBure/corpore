/*
  Warnings:

  - You are about to drop the column `duréeMin` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `sport` on the `Session` table. All the data in the column will be lost.
  - Added the required column `isTemplate` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warmupTime` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Exercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "defaultSets" INTEGER NOT NULL,
    "defaultReps" INTEGER NOT NULL,
    "defaultRestBetweenSets" INTEGER NOT NULL,
    "defaultRestAfter" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "SessionExercise" (
    "sessionId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "restBetweenSets" INTEGER NOT NULL,
    "restAfter" INTEGER NOT NULL,

    PRIMARY KEY ("sessionId", "exerciseId")
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "warmupTime" INTEGER NOT NULL,
    "isTemplate" BOOLEAN NOT NULL
);
INSERT INTO "new_Session" ("date", "id") SELECT "date", "id" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SessionExercise_exerciseId_idx" ON "SessionExercise"("exerciseId");

-- CreateIndex
CREATE INDEX "SessionExercise_sessionId_idx" ON "SessionExercise"("sessionId");
