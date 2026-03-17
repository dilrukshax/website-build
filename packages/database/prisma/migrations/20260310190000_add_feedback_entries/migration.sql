-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('rating', 'suggestion');

-- CreateTable
CREATE TABLE "feedback_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "score" INTEGER,
    "note" TEXT,
    "title" TEXT,
    "message" TEXT,
    "submitted_by_user_id" TEXT NOT NULL,
    "submitted_by_email" TEXT NOT NULL,
    "submitted_by_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_entries_tenant_id_idx" ON "feedback_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "feedback_entries_tenant_id_type_created_at_idx" ON "feedback_entries"("tenant_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "feedback_entries_created_at_idx" ON "feedback_entries"("created_at");

-- AddForeignKey
ALTER TABLE "feedback_entries" ADD CONSTRAINT "feedback_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
