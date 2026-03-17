-- CreateEnum
CREATE TYPE "ReferralAction" AS ENUM ('allow', 'verify', 'review', 'block');

-- CreateEnum
CREATE TYPE "ReferralClaimStatus" AS ENUM ('pending', 'verify', 'review', 'blocked', 'rewarded');

-- CreateTable
CREATE TABLE "device_fingerprints" (
    "id" TEXT NOT NULL,
    "fingerprint_hash" TEXT NOT NULL,
    "persistent_token" TEXT,
    "ip_address" INET,
    "webgl_vendor" TEXT,
    "webgl_renderer" TEXT,
    "screen_signals" JSONB,
    "hardware_signals" JSONB,
    "evasion_flags" JSONB,
    "components_jsonb" JSONB,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_devices" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "account_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_profiles" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "referral_code" TEXT NOT NULL,
    "total_referrals" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_claims" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referee_id" TEXT NOT NULL,
    "referral_code" TEXT NOT NULL,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "action_taken" "ReferralAction" NOT NULL DEFAULT 'allow',
    "status" "ReferralClaimStatus" NOT NULL DEFAULT 'pending',
    "flags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "device_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "rewarded_at" TIMESTAMP(3),

    CONSTRAINT "referral_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_fraud_log" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT,
    "referee_id" TEXT,
    "referral_code" TEXT,
    "risk_score" INTEGER,
    "action_taken" TEXT,
    "flags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "shared_device_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_fraud_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_fingerprints_fingerprint_hash_idx" ON "device_fingerprints"("fingerprint_hash");

-- CreateIndex
CREATE INDEX "device_fingerprints_persistent_token_idx" ON "device_fingerprints"("persistent_token");

-- CreateIndex
CREATE INDEX "device_fingerprints_ip_address_created_at_idx" ON "device_fingerprints"("ip_address", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "account_devices_account_id_device_id_key" ON "account_devices"("account_id", "device_id");

-- CreateIndex
CREATE INDEX "account_devices_account_id_idx" ON "account_devices"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_profiles_account_id_key" ON "referral_profiles"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_profiles_referral_code_key" ON "referral_profiles"("referral_code");

-- CreateIndex
CREATE INDEX "referral_profiles_referral_code_idx" ON "referral_profiles"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "referral_claims_referee_id_key" ON "referral_claims"("referee_id");

-- CreateIndex
CREATE INDEX "referral_claims_referrer_id_idx" ON "referral_claims"("referrer_id");

-- CreateIndex
CREATE INDEX "referral_claims_referral_code_idx" ON "referral_claims"("referral_code");

-- CreateIndex
CREATE INDEX "referral_claims_status_idx" ON "referral_claims"("status");

-- AddForeignKey
ALTER TABLE "account_devices" ADD CONSTRAINT "account_devices_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_fingerprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_claims" ADD CONSTRAINT "referral_claims_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "referral_profiles"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_claims" ADD CONSTRAINT "referral_claims_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_fingerprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_fraud_log" ADD CONSTRAINT "referral_fraud_log_shared_device_id_fkey" FOREIGN KEY ("shared_device_id") REFERENCES "device_fingerprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
