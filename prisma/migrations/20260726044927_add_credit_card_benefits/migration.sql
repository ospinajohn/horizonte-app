-- AlterTable
ALTER TABLE "CreditCard" ADD COLUMN "benefitCategories" TEXT;
ALTER TABLE "CreditCard" ADD COLUMN "benefitTypes" TEXT;
ALTER TABLE "CreditCard" ADD COLUMN "cashbackPercent" REAL DEFAULT 0;
ALTER TABLE "CreditCard" ADD COLUMN "franchise" TEXT;
