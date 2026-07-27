-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userName" TEXT NOT NULL DEFAULT 'Usuario',
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "language" TEXT NOT NULL DEFAULT 'es',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "weekStartDay" INTEGER NOT NULL DEFAULT 1,
    "payDay" INTEGER NOT NULL DEFAULT 15,
    "secondPayDay" INTEGER,
    "financialViewDefault" TEXT NOT NULL DEFAULT 'MONTHLY',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppConfig" ("createdAt", "currency", "id", "language", "onboardingCompleted", "payDay", "secondPayDay", "theme", "updatedAt", "userName", "weekStartDay") SELECT "createdAt", "currency", "id", "language", "onboardingCompleted", "payDay", "secondPayDay", "theme", "updatedAt", "userName", "weekStartDay" FROM "AppConfig";
DROP TABLE "AppConfig";
ALTER TABLE "new_AppConfig" RENAME TO "AppConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
