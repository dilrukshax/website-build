-- Add persisted primary full domain for instances.
-- No backfill is applied by design.
ALTER TABLE "instances"
ADD COLUMN "full_domain" TEXT;
