-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "sport" TEXT NOT NULL,
    "duréeMin" INTEGER NOT NULL,
    "note" TEXT
);
