-- Multi-account Cloudflare for SaaS support

CREATE TYPE "CustomDomainAccountEventType" AS ENUM ('attached', 'reassigned', 'detached', 'legacy_import');

CREATE TABLE "cloudflare_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cloudflare_account_id" TEXT,
    "zone_id" TEXT NOT NULL,
    "zone_name" TEXT,
    "api_token_encrypted" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "fallback_origin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloudflare_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "custom_domain_account_history" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "event_type" "CustomDomainAccountEventType" NOT NULL,
    "from_account_id" TEXT,
    "to_account_id" TEXT,
    "actor_user_id" TEXT,
    "metadata_jsonb" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_domain_account_history_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "instances"
    ADD COLUMN "cloudflare_account_id" TEXT;

CREATE UNIQUE INDEX "cloudflare_accounts_zone_id_key" ON "cloudflare_accounts"("zone_id");
CREATE INDEX "cloudflare_accounts_is_active_is_default_idx" ON "cloudflare_accounts"("is_active", "is_default");
CREATE UNIQUE INDEX "cloudflare_accounts_single_default_idx" ON "cloudflare_accounts"("is_default") WHERE "is_default" = true;

CREATE INDEX "instances_cloudflare_account_id_idx" ON "instances"("cloudflare_account_id");

CREATE INDEX "custom_domain_account_history_instance_id_created_at_idx" ON "custom_domain_account_history"("instance_id", "created_at");
CREATE INDEX "custom_domain_account_history_domain_created_at_idx" ON "custom_domain_account_history"("domain", "created_at");
CREATE INDEX "custom_domain_account_history_from_account_id_idx" ON "custom_domain_account_history"("from_account_id");
CREATE INDEX "custom_domain_account_history_to_account_id_idx" ON "custom_domain_account_history"("to_account_id");

ALTER TABLE "instances"
    ADD CONSTRAINT "instances_cloudflare_account_id_fkey"
    FOREIGN KEY ("cloudflare_account_id") REFERENCES "cloudflare_accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "custom_domain_account_history"
    ADD CONSTRAINT "custom_domain_account_history_instance_id_fkey"
    FOREIGN KEY ("instance_id") REFERENCES "instances"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "custom_domain_account_history"
    ADD CONSTRAINT "custom_domain_account_history_from_account_id_fkey"
    FOREIGN KEY ("from_account_id") REFERENCES "cloudflare_accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "custom_domain_account_history"
    ADD CONSTRAINT "custom_domain_account_history_to_account_id_fkey"
    FOREIGN KEY ("to_account_id") REFERENCES "cloudflare_accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
