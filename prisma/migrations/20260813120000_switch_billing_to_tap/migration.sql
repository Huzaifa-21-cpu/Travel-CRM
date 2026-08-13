-- Switch billing provider from Stripe to Tap Payments: Tap has no
-- subscription object, so we drop the subscription id and rename the
-- customer id column to reflect the new provider.
DROP INDEX "Agency_stripeSubscriptionId_key";
ALTER TABLE "Agency" DROP COLUMN "stripeSubscriptionId";
ALTER TABLE "Agency" RENAME COLUMN "stripeCustomerId" TO "tapCustomerId";
ALTER INDEX "Agency_stripeCustomerId_key" RENAME TO "Agency_tapCustomerId_key";
