-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('aliexpress');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('disconnected', 'connected', 'expired', 'error');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('imported', 'needs_review', 'approved', 'rejected', 'published');

-- CreateEnum
CREATE TYPE "MarginType" AS ENUM ('percent', 'fixed');

-- CreateTable
CREATE TABLE "store_commerce_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "niche" TEXT,
    "store_currency" TEXT NOT NULL DEFAULT 'USD',
    "legal_business_name" TEXT,
    "business_address" TEXT,
    "support_email" TEXT,
    "support_phone" TEXT,
    "support_whatsapp" TEXT,
    "shipping_policy" TEXT,
    "returns_policy" TEXT,
    "refund_policy" TEXT,
    "privacy_policy" TEXT,
    "terms_policy" TEXT,
    "shipping_lead_days" INTEGER,
    "default_fx_rate" DECIMAL(12,6),
    "order_number_prefix" TEXT,
    "next_order_seq" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_commerce_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL DEFAULT 'aliexpress',
    "display_name" TEXT NOT NULL,
    "status" "SupplierStatus" NOT NULL DEFAULT 'disconnected',
    "credential_enc" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_product_imports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_item_ref" TEXT NOT NULL,
    "source_url" TEXT,
    "raw_jsonb" JSONB NOT NULL,
    "normalized_jsonb" JSONB,
    "availability_jsonb" JSONB,
    "status" "ImportStatus" NOT NULL DEFAULT 'imported',
    "review_note" TEXT,
    "published_product_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_product_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "margin_type" "MarginType" NOT NULL DEFAULT 'percent',
    "margin_value" DECIMAL(10,2) NOT NULL,
    "rounding_mode" TEXT NOT NULL DEFAULT 'end_99',
    "min_margin" DECIMAL(10,2),
    "fx_rate" DECIMAL(12,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_commerce_profiles_instance_id_key" ON "store_commerce_profiles"("instance_id");

-- CreateIndex
CREATE INDEX "store_commerce_profiles_tenant_id_idx" ON "store_commerce_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");

-- CreateIndex
CREATE INDEX "suppliers_instance_id_idx" ON "suppliers"("instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_product_imports_instance_id_supplier_item_ref_key" ON "supplier_product_imports"("instance_id", "supplier_item_ref");

-- CreateIndex
CREATE INDEX "supplier_product_imports_tenant_id_idx" ON "supplier_product_imports"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_product_imports_instance_id_status_idx" ON "supplier_product_imports"("instance_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_rules_instance_id_key" ON "pricing_rules"("instance_id");

-- CreateIndex
CREATE INDEX "pricing_rules_tenant_id_idx" ON "pricing_rules"("tenant_id");

-- AddForeignKey
ALTER TABLE "store_commerce_profiles" ADD CONSTRAINT "store_commerce_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_commerce_profiles" ADD CONSTRAINT "store_commerce_profiles_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_product_imports" ADD CONSTRAINT "supplier_product_imports_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_product_imports" ADD CONSTRAINT "supplier_product_imports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_product_imports" ADD CONSTRAINT "supplier_product_imports_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
