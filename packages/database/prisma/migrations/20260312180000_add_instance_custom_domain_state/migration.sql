ALTER TABLE "instances"
    ADD COLUMN "cloudflare_hostname_id" TEXT,
    ADD COLUMN "custom_domain_hostname_status" TEXT,
    ADD COLUMN "custom_domain_ssl_status" TEXT,
    ADD COLUMN "custom_domain_last_checked_at" TIMESTAMP(3),
    ADD COLUMN "custom_domain_activated_at" TIMESTAMP(3);

UPDATE "instances"
SET "cloudflare_hostname_id" = NULLIF("settings_jsonb"->>'cloudflareHostnameId', '')
WHERE "cloudflare_hostname_id" IS NULL
  AND "settings_jsonb" IS NOT NULL
  AND ("settings_jsonb" ? 'cloudflareHostnameId');

UPDATE "instances"
SET "settings_jsonb" = "settings_jsonb" - 'cloudflareHostnameId'
WHERE "settings_jsonb" IS NOT NULL
  AND ("settings_jsonb" ? 'cloudflareHostnameId');
