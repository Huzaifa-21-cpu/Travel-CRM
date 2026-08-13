-- Default new quotations to OMR instead of USD.
ALTER TABLE "Quotation" ALTER COLUMN "currency" SET DEFAULT 'OMR';
