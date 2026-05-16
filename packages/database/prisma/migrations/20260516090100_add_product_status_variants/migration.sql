-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "VariantAvailability" AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'discontinued', 'unknown');

-- AlterTable
ALTER TABLE "products"
    ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    ADD COLUMN "supplier_id" TEXT,
    ADD COLUMN "supplier_item_ref" TEXT,
    ADD COLUMN "source_url" TEXT,
    ADD COLUMN "cost_price" DECIMAL(10,2),
    ADD COLUMN "compare_at_price" DECIMAL(10,2),
    ADD COLUMN "slug" TEXT,
    ADD COLUMN "gallery_jsonb" JSONB,
    ADD COLUMN "shipping_info" TEXT;

-- Backfill: existing live products remain visible to legacy product theme code
UPDATE "products" SET "status" = 'active' WHERE "is_active" = true;

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT,
    "options_jsonb" JSONB,
    "supplier_variant_ref" TEXT,
    "supplier_sku_id" TEXT,
    "cost_price" DECIMAL(10,2),
    "price" DECIMAL(10,2) NOT NULL,
    "compare_at_price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "availability" "VariantAvailability" NOT NULL DEFAULT 'unknown',
    "stock_qty" INTEGER,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_instance_id_status_idx" ON "products"("instance_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_sku_key" ON "product_variants"("product_id", "sku");

-- CreateIndex
CREATE INDEX "product_variants_tenant_id_idx" ON "product_variants"("tenant_id");

-- CreateIndex
CREATE INDEX "product_variants_instance_id_idx" ON "product_variants"("instance_id");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
