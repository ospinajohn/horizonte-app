-- CreateTable
CREATE TABLE "HealthSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "score" REAL NOT NULL,
    "liquidityScore" REAL NOT NULL,
    "savingsScore" REAL NOT NULL,
    "debtScore" REAL NOT NULL,
    "patrimonyScore" REAL NOT NULL,
    "budgetScore" REAL NOT NULL,
    "emergencyFundScore" REAL NOT NULL,
    "trendScore" REAL NOT NULL,
    "diversificationScore" REAL NOT NULL,
    "snapshotDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recommendations" TEXT
);

-- CreateTable
CREATE TABLE "RecommendationLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT,
    "actionPath" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DecisionQuery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
