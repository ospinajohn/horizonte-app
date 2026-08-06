-- Agregar campos de suscripción a RecurringItem (Compromiso)
ALTER TABLE "RecurringItem" ADD COLUMN "isSubscription" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RecurringItem" ADD COLUMN "subscriptionCategory" TEXT;
ALTER TABLE "RecurringItem" ADD COLUMN "lastBilledAmount" REAL;
ALTER TABLE "RecurringItem" ADD COLUMN "color" TEXT;
ALTER TABLE "RecurringItem" ADD COLUMN "icon" TEXT;

-- Migrar datos de Subscription hacia su RecurringItem vinculado (Subscription.recurringItemId es la fuente de verdad más reciente)
UPDATE "RecurringItem"
SET
  "name" = (SELECT "name" FROM "Subscription" WHERE "Subscription"."recurringItemId" = "RecurringItem"."id"),
  "amount" = (SELECT "amount" FROM "Subscription" WHERE "Subscription"."recurringItemId" = "RecurringItem"."id"),
  "accountId" = COALESCE((SELECT "accountId" FROM "Subscription" WHERE "Subscription"."recurringItemId" = "RecurringItem"."id"), "RecurringItem"."accountId"),
  "isActive" = (SELECT "isActive" FROM "Subscription" WHERE "Subscription"."recurringItemId" = "RecurringItem"."id"),
  "isSubscription" = true,
  "subscriptionCategory" = (SELECT "category" FROM "Subscription" WHERE "Subscription"."recurringItemId" = "RecurringItem"."id"),
  "lastBilledAmount" = (SELECT "lastBilledAmount" FROM "Subscription" WHERE "Subscription"."recurringItemId" = "RecurringItem"."id"),
  "color" = (SELECT "color" FROM "Subscription" WHERE "Subscription"."recurringItemId" = "RecurringItem"."id"),
  "icon" = (SELECT "icon" FROM "Subscription" WHERE "Subscription"."recurringItemId" = "RecurringItem"."id")
WHERE "id" IN (SELECT "recurringItemId" FROM "Subscription" WHERE "recurringItemId" IS NOT NULL);

-- Crear RecurringItem para suscripciones sin vínculo previo (caso borde defensivo)
INSERT INTO "RecurringItem" ("name","type","amount","recurrence","nextDate","description","accountId","isActive","isSubscription","subscriptionCategory","lastBilledAmount","color","icon","createdAt","updatedAt")
SELECT
  "name",
  'EXPENSE',
  "amount",
  'MONTHLY',
  CURRENT_TIMESTAMP,
  'Suscripción ' || "name",
  "accountId",
  "isActive",
  true,
  "category",
  "lastBilledAmount",
  "color",
  "icon",
  "createdAt",
  "updatedAt"
FROM "Subscription"
WHERE "recurringItemId" IS NULL;

-- Eliminar tabla Subscription (ya fusionada dentro de RecurringItem)
DROP TABLE "Subscription";
