-- Add source metadata fields for tracing inquiry origin from public forms/pages
ALTER TABLE "inquiries"
ADD COLUMN "source_type" TEXT,
ADD COLUMN "source_page_slug" TEXT;

-- Optimize reporting/filtering by instance + source metadata
CREATE INDEX "inquiries_instance_id_source_type_source_page_slug_idx"
ON "inquiries"("instance_id", "source_type", "source_page_slug");
