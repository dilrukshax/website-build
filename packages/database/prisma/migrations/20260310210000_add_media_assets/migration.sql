-- CreateEnum
CREATE TYPE "MediaUploadStatus" AS ENUM ('pending', 'uploaded', 'failed');

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "file_name" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "bucket_name" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "status" "MediaUploadStatus" NOT NULL DEFAULT 'pending',
    "metadata_jsonb" JSONB,
    "uploaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_object_key_key" ON "media_assets"("object_key");

-- CreateIndex
CREATE INDEX "media_assets_tenant_id_idx" ON "media_assets"("tenant_id");

-- CreateIndex
CREATE INDEX "media_assets_instance_id_idx" ON "media_assets"("instance_id");

-- CreateIndex
CREATE INDEX "media_assets_status_idx" ON "media_assets"("status");

-- CreateIndex
CREATE INDEX "media_assets_instance_id_created_at_idx" ON "media_assets"("instance_id", "created_at");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
