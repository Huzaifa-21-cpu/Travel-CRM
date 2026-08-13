-- Quote creation no longer collects a tax rate or agency cost — every
-- quote total is now just the line-item subtotal.
ALTER TABLE "Quotation" DROP COLUMN "tax";
ALTER TABLE "Quotation" DROP COLUMN "agencyCost";
