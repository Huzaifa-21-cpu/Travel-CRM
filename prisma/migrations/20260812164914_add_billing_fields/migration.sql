-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "whatsappPhoneNumberId" TEXT,
    "aiKnowledgeBase" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT NOT NULL DEFAULT 'TRIAL',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'trialing',
    "trialEndsAt" DATETIME,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" DATETIME
);
INSERT INTO "new_Agency" ("aiKnowledgeBase", "createdAt", "id", "name", "whatsappPhoneNumberId") SELECT "aiKnowledgeBase", "createdAt", "id", "name", "whatsappPhoneNumberId" FROM "Agency";
DROP TABLE "Agency";
ALTER TABLE "new_Agency" RENAME TO "Agency";
CREATE UNIQUE INDEX "Agency_whatsappPhoneNumberId_key" ON "Agency"("whatsappPhoneNumberId");
CREATE UNIQUE INDEX "Agency_stripeCustomerId_key" ON "Agency"("stripeCustomerId");
CREATE UNIQUE INDEX "Agency_stripeSubscriptionId_key" ON "Agency"("stripeSubscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
