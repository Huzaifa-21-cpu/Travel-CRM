-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "agencyCost" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "dob" TIMESTAMP(3),
    "passportNumber" TEXT,
    "passportExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_customerId_idx" ON "Document"("customerId");

-- CreateIndex
CREATE INDEX "FamilyMember_customerId_idx" ON "FamilyMember"("customerId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
