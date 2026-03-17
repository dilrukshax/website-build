-- AlterTable
ALTER TABLE "services"
ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Backfill stable ordering per instance from oldest to newest
WITH ordered_services AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "instance_id"
            ORDER BY "created_at" ASC, "id" ASC
        ) - 1 AS sort_order
    FROM "services"
)
UPDATE "services" s
SET "sort_order" = o.sort_order
FROM ordered_services o
WHERE s."id" = o."id";

-- CreateIndex
CREATE INDEX "services_instance_id_sort_order_idx" ON "services"("instance_id", "sort_order");
