-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN "order_id" TEXT;

-- CreateTable
CREATE TABLE "automation_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "instance_id" TEXT,
    "type" TEXT NOT NULL,
    "payload_jsonb" JSONB NOT NULL,
    "run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "locked_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_tasks_status_run_at_idx" ON "automation_tasks"("status", "run_at");

-- CreateIndex
CREATE INDEX "automation_tasks_instance_id_idx" ON "automation_tasks"("instance_id");
