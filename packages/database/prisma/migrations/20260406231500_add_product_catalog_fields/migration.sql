-- Add dedicated products catalog table (instance-scoped).

CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "products_tenant_id_idx"
ON "products" ("tenant_id");

CREATE INDEX IF NOT EXISTS "products_instance_id_idx"
ON "products" ("instance_id");

CREATE INDEX IF NOT EXISTS "products_instance_id_is_active_idx"
ON "products" ("instance_id", "is_active");

CREATE INDEX IF NOT EXISTS "products_instance_id_sort_order_idx"
ON "products" ("instance_id", "sort_order");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'products_instance_id_fkey'
    ) THEN
        ALTER TABLE "products"
            ADD CONSTRAINT "products_instance_id_fkey"
            FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
