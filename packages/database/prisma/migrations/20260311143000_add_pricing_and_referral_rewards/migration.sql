-- ============================================================
-- Pricing, Billing, Credits, and Referral Rewards
-- ============================================================

-- Enums
CREATE TYPE "PlanTier" AS ENUM ('free', 'starter', 'freelance', 'enterprise');
CREATE TYPE "BillingInterval" AS ENUM ('monthly', 'annual');
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'inactive');
CREATE TYPE "BillingChargeType" AS ENUM ('plan_change', 'addon_bundle');
CREATE TYPE "BillingChargeStatus" AS ENUM ('pending', 'confirmed', 'rejected');
CREATE TYPE "CreditLedgerType" AS ENUM ('credit', 'debit', 'adjustment');
CREATE TYPE "ReferralRewardMilestone" AS ENUM (
  'free_activation',
  'starter_monthly',
  'starter_annual',
  'freelance_monthly',
  'freelance_annual',
  'enterprise_small',
  'enterprise_medium',
  'enterprise_large'
);
CREATE TYPE "ReferralRewardStatus" AS ENUM ('pending', 'granted', 'rejected');
CREATE TYPE "ReferralPointLedgerType" AS ENUM ('credit', 'debit', 'expiry');
CREATE TYPE "ReferralRedemptionStatus" AS ENUM ('completed', 'cancelled');
CREATE TYPE "EnterpriseRewardTier" AS ENUM ('small', 'medium', 'large');
CREATE TYPE "EnterpriseRewardReviewStatus" AS ENUM ('approved', 'rejected');

-- Tenant + Instance + Catalog extensions
ALTER TABLE "tenants"
ADD COLUMN "billing_interval" "BillingInterval" NOT NULL DEFAULT 'monthly',
ADD COLUMN "addon_bundles" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "instances"
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE "themes"
ADD COLUMN "access_rank" INTEGER NOT NULL DEFAULT 100;

ALTER TABLE "page_templates"
ADD COLUMN "is_premium" BOOLEAN NOT NULL DEFAULT false;

-- Convert tenant plan text to enum and normalize values
ALTER TABLE "tenants"
ALTER COLUMN "plan" DROP DEFAULT;

ALTER TABLE "tenants"
ALTER COLUMN "plan" TYPE "PlanTier"
USING (
  CASE
    WHEN LOWER("plan") = 'starter' THEN 'starter'::"PlanTier"
    WHEN LOWER("plan") IN ('freelance', 'professional', 'pro') THEN 'freelance'::"PlanTier"
    WHEN LOWER("plan") = 'enterprise' THEN 'enterprise'::"PlanTier"
    ELSE 'free'::"PlanTier"
  END
);

ALTER TABLE "tenants"
ALTER COLUMN "plan" SET DEFAULT 'free'::"PlanTier";

-- Product requirement: migrate all tenants to free
UPDATE "tenants" SET "plan" = 'free'::"PlanTier";

-- Plan catalogs
CREATE TABLE "plan_catalogs" (
  "id" TEXT NOT NULL,
  "plan" "PlanTier" NOT NULL,
  "monthly_price_cents" INTEGER NOT NULL,
  "annual_price_cents" INTEGER NOT NULL,
  "max_instances" INTEGER,
  "max_custom_domains" INTEGER,
  "max_pages_per_instance" INTEGER,
  "max_accessible_themes" INTEGER,
  "allow_premium_templates" BOOLEAN NOT NULL DEFAULT false,
  "max_bookings_per_day" INTEGER,
  "max_active_services" INTEGER,
  "allow_staff_accounts" BOOLEAN NOT NULL DEFAULT false,
  "allow_addon_bundle" BOOLEAN NOT NULL DEFAULT false,
  "addon_monthly_price_cents" INTEGER,
  "addon_annual_price_cents" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_catalogs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_catalogs_plan_key" ON "plan_catalogs"("plan");

CREATE TABLE "plan_referral_multipliers" (
  "id" TEXT NOT NULL,
  "plan" "PlanTier" NOT NULL,
  "multiplier" DECIMAL(6,3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_referral_multipliers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_referral_multipliers_plan_key" ON "plan_referral_multipliers"("plan");

CREATE TABLE "referral_reward_rules" (
  "id" TEXT NOT NULL,
  "milestone" "ReferralRewardMilestone" NOT NULL,
  "base_points" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "referral_reward_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referral_reward_rules_milestone_key" ON "referral_reward_rules"("milestone");

-- Subscription + billing + wallet
CREATE TABLE "tenant_subscriptions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "plan" "PlanTier" NOT NULL,
  "billing_interval" "BillingInterval" NOT NULL,
  "addon_bundles" INTEGER NOT NULL DEFAULT 0,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "current_period_end" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_subscriptions_tenant_id_key" ON "tenant_subscriptions"("tenant_id");
CREATE INDEX "tenant_subscriptions_plan_billing_interval_idx" ON "tenant_subscriptions"("plan", "billing_interval");

CREATE TABLE "billing_charges" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "requested_by_user_id" TEXT NOT NULL,
  "charge_type" "BillingChargeType" NOT NULL,
  "requested_plan" "PlanTier",
  "requested_interval" "BillingInterval",
  "requested_addon_bundles" INTEGER,
  "amount_cents" INTEGER NOT NULL,
  "credit_applied_cents" INTEGER NOT NULL DEFAULT 0,
  "net_amount_cents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "BillingChargeStatus" NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "metadata_jsonb" JSONB,
  "reviewed_by_user_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_charges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "billing_charges_tenant_id_status_created_at_idx" ON "billing_charges"("tenant_id", "status", "created_at");

CREATE TABLE "tenant_credit_wallets" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "balance_cents" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_credit_wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_credit_wallets_tenant_id_key" ON "tenant_credit_wallets"("tenant_id");

CREATE TABLE "tenant_credit_ledger" (
  "id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "charge_id" TEXT,
  "redemption_id" TEXT,
  "entry_type" "CreditLedgerType" NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_credit_ledger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tenant_credit_ledger_wallet_id_created_at_idx" ON "tenant_credit_ledger"("wallet_id", "created_at");
CREATE INDEX "tenant_credit_ledger_tenant_id_created_at_idx" ON "tenant_credit_ledger"("tenant_id", "created_at");

-- Referral proof + rewards + points
CREATE TABLE "referral_fraud_proofs" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "referral_code" TEXT,
  "device_id" TEXT NOT NULL,
  "risk_score" INTEGER NOT NULL DEFAULT 0,
  "action_taken" "ReferralAction" NOT NULL DEFAULT 'allow',
  "flags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "proof_token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referral_fraud_proofs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referral_fraud_proofs_proof_token_hash_key" ON "referral_fraud_proofs"("proof_token_hash");
CREATE INDEX "referral_fraud_proofs_account_id_created_at_idx" ON "referral_fraud_proofs"("account_id", "created_at");
CREATE INDEX "referral_fraud_proofs_expires_at_idx" ON "referral_fraud_proofs"("expires_at");

ALTER TABLE "referral_claims"
ADD COLUMN "fraud_proof_id" TEXT;

CREATE TABLE "referral_reward_events" (
  "id" TEXT NOT NULL,
  "claim_id" TEXT,
  "charge_id" TEXT,
  "referrer_id" TEXT NOT NULL,
  "referee_id" TEXT NOT NULL,
  "milestone" "ReferralRewardMilestone" NOT NULL,
  "base_points" INTEGER NOT NULL,
  "multiplier" DECIMAL(6,3) NOT NULL,
  "awarded_points" INTEGER NOT NULL,
  "status" "ReferralRewardStatus" NOT NULL DEFAULT 'granted',
  "approved_by_user_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "granted_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "referral_reward_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referral_reward_events_referee_id_milestone_key" ON "referral_reward_events"("referee_id", "milestone");
CREATE INDEX "referral_reward_events_referrer_id_status_idx" ON "referral_reward_events"("referrer_id", "status");
CREATE INDEX "referral_reward_events_claim_id_idx" ON "referral_reward_events"("claim_id");

CREATE TABLE "referral_points_wallets" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "available_points" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "referral_points_wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referral_points_wallets_account_id_key" ON "referral_points_wallets"("account_id");

CREATE TABLE "referral_redemptions" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "requested_points" INTEGER NOT NULL,
  "credited_cents" INTEGER NOT NULL,
  "status" "ReferralRedemptionStatus" NOT NULL DEFAULT 'completed',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "referral_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "referral_redemptions_account_id_created_at_idx" ON "referral_redemptions"("account_id", "created_at");
CREATE INDEX "referral_redemptions_tenant_id_created_at_idx" ON "referral_redemptions"("tenant_id", "created_at");

CREATE TABLE "referral_points_ledger" (
  "id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "reward_event_id" TEXT,
  "redemption_id" TEXT,
  "source_entry_id" TEXT,
  "entry_type" "ReferralPointLedgerType" NOT NULL,
  "points" INTEGER NOT NULL,
  "remaining_points" INTEGER,
  "expires_at" TIMESTAMP(3),
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referral_points_ledger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "referral_points_ledger_wallet_id_created_at_idx" ON "referral_points_ledger"("wallet_id", "created_at");
CREATE INDEX "referral_points_ledger_account_id_expires_at_idx" ON "referral_points_ledger"("account_id", "expires_at");
CREATE INDEX "referral_points_ledger_entry_type_idx" ON "referral_points_ledger"("entry_type");

CREATE TABLE "enterprise_reward_approvals" (
  "id" TEXT NOT NULL,
  "reward_event_id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "reviewer_user_id" TEXT NOT NULL,
  "tier" "EnterpriseRewardTier" NOT NULL,
  "approved_points" INTEGER NOT NULL,
  "status" "EnterpriseRewardReviewStatus" NOT NULL DEFAULT 'approved',
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "enterprise_reward_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "enterprise_reward_approvals_reward_event_id_key" ON "enterprise_reward_approvals"("reward_event_id");
CREATE INDEX "enterprise_reward_approvals_claim_id_idx" ON "enterprise_reward_approvals"("claim_id");
CREATE INDEX "enterprise_reward_approvals_reviewer_user_id_created_at_idx" ON "enterprise_reward_approvals"("reviewer_user_id", "created_at");

-- Foreign keys
ALTER TABLE "tenant_subscriptions"
ADD CONSTRAINT "tenant_subscriptions_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "billing_charges"
ADD CONSTRAINT "billing_charges_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_credit_wallets"
ADD CONSTRAINT "tenant_credit_wallets_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_credit_ledger"
ADD CONSTRAINT "tenant_credit_ledger_wallet_id_fkey"
FOREIGN KEY ("wallet_id") REFERENCES "tenant_credit_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_credit_ledger"
ADD CONSTRAINT "tenant_credit_ledger_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_credit_ledger"
ADD CONSTRAINT "tenant_credit_ledger_charge_id_fkey"
FOREIGN KEY ("charge_id") REFERENCES "billing_charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_claims"
ADD CONSTRAINT "referral_claims_fraud_proof_id_fkey"
FOREIGN KEY ("fraud_proof_id") REFERENCES "referral_fraud_proofs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_reward_events"
ADD CONSTRAINT "referral_reward_events_claim_id_fkey"
FOREIGN KEY ("claim_id") REFERENCES "referral_claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_reward_events"
ADD CONSTRAINT "referral_reward_events_charge_id_fkey"
FOREIGN KEY ("charge_id") REFERENCES "billing_charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_points_wallets"
ADD CONSTRAINT "referral_points_wallets_account_id_fkey"
FOREIGN KEY ("account_id") REFERENCES "referral_profiles"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_redemptions"
ADD CONSTRAINT "referral_redemptions_wallet_id_fkey"
FOREIGN KEY ("wallet_id") REFERENCES "referral_points_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_redemptions"
ADD CONSTRAINT "referral_redemptions_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_credit_ledger"
ADD CONSTRAINT "tenant_credit_ledger_redemption_id_fkey"
FOREIGN KEY ("redemption_id") REFERENCES "referral_redemptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_points_ledger"
ADD CONSTRAINT "referral_points_ledger_wallet_id_fkey"
FOREIGN KEY ("wallet_id") REFERENCES "referral_points_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_points_ledger"
ADD CONSTRAINT "referral_points_ledger_reward_event_id_fkey"
FOREIGN KEY ("reward_event_id") REFERENCES "referral_reward_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_points_ledger"
ADD CONSTRAINT "referral_points_ledger_redemption_id_fkey"
FOREIGN KEY ("redemption_id") REFERENCES "referral_redemptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_points_ledger"
ADD CONSTRAINT "referral_points_ledger_source_entry_id_fkey"
FOREIGN KEY ("source_entry_id") REFERENCES "referral_points_ledger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "enterprise_reward_approvals"
ADD CONSTRAINT "enterprise_reward_approvals_reward_event_id_fkey"
FOREIGN KEY ("reward_event_id") REFERENCES "referral_reward_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "enterprise_reward_approvals"
ADD CONSTRAINT "enterprise_reward_approvals_claim_id_fkey"
FOREIGN KEY ("claim_id") REFERENCES "referral_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill subscriptions for existing tenants
INSERT INTO "tenant_subscriptions" (
  "id",
  "tenant_id",
  "plan",
  "billing_interval",
  "addon_bundles",
  "status",
  "started_at",
  "created_at",
  "updated_at"
)
SELECT
  ('sub-' || t."id"),
  t."id",
  t."plan",
  t."billing_interval",
  t."addon_bundles",
  'active'::"SubscriptionStatus",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "tenants" t;
