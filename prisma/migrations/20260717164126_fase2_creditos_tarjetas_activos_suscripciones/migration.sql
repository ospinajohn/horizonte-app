-- CreateTable
CREATE TABLE "Credit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityName" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "pendingAmount" REAL NOT NULL,
    "annualRate" REAL NOT NULL,
    "monthlyPayment" REAL NOT NULL,
    "paymentDay" INTEGER NOT NULL,
    "totalInstallments" INTEGER NOT NULL,
    "paidInstallments" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "recurringItemId" INTEGER
);

-- CreateTable
CREATE TABLE "AmortizationRow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "installment" INTEGER NOT NULL,
    "payment" REAL NOT NULL,
    "principal" REAL NOT NULL,
    "interest" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "creditId" INTEGER NOT NULL,
    CONSTRAINT "AmortizationRow_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "totalLimit" REAL NOT NULL,
    "cutDay" INTEGER NOT NULL,
    "paymentDay" INTEGER NOT NULL,
    "annualRate" REAL NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CreditCardPurchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "isAdvance" BOOLEAN NOT NULL DEFAULT false,
    "billingPeriod" TEXT,
    "cardId" INTEGER NOT NULL,
    CONSTRAINT "CreditCardPurchase_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CreditCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currentValue" REAL NOT NULL,
    "acquisitionValue" REAL NOT NULL DEFAULT 0,
    "acquisitionDate" DATETIME,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Liability" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "creditor" TEXT,
    "dueDate" DATETIME,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "billingDay" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ENTERTAINMENT',
    "accountId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastBilledAmount" REAL,
    "notes" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "icon" TEXT NOT NULL DEFAULT 'repeat',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "recurringItemId" INTEGER
);

-- CreateTable
CREATE TABLE "SimulationScenario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "parameters" TEXT NOT NULL,
    "results" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PatrimonySnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "totalAssets" REAL NOT NULL,
    "totalLiabilities" REAL NOT NULL,
    "netWorth" REAL NOT NULL,
    "snapshotDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecurringItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "recurrence" TEXT NOT NULL,
    "nextDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "description" TEXT,
    "categoryId" INTEGER,
    "accountId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecurringItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecurringItem" ("accountId", "amount", "categoryId", "createdAt", "description", "endDate", "id", "isActive", "name", "nextDate", "recurrence", "type", "updatedAt") SELECT "accountId", "amount", "categoryId", "createdAt", "description", "endDate", "id", "isActive", "name", "nextDate", "recurrence", "type", "updatedAt" FROM "RecurringItem";
DROP TABLE "RecurringItem";
ALTER TABLE "new_RecurringItem" RENAME TO "RecurringItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
