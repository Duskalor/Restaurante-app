-- CreateTable
CREATE TABLE "public"."BusinessSetting" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ruc" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSetting_branchId_key" ON "public"."BusinessSetting"("branchId");

-- AddForeignKey
ALTER TABLE "public"."BusinessSetting" ADD CONSTRAINT "BusinessSetting_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
