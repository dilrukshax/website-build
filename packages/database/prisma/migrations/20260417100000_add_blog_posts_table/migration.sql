-- Add blog posts table (instance-scoped).

CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content_html" TEXT NOT NULL,
    "featured_image_url" TEXT,
    "seo_jsonb" JSONB,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_instance_id_slug_key"
ON "blog_posts" ("instance_id", "slug");

CREATE INDEX IF NOT EXISTS "blog_posts_tenant_id_idx"
ON "blog_posts" ("tenant_id");

CREATE INDEX IF NOT EXISTS "blog_posts_instance_id_idx"
ON "blog_posts" ("instance_id");

CREATE INDEX IF NOT EXISTS "blog_posts_instance_id_is_published_idx"
ON "blog_posts" ("instance_id", "is_published");

CREATE INDEX IF NOT EXISTS "blog_posts_instance_id_published_at_idx"
ON "blog_posts" ("instance_id", "published_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'blog_posts_instance_id_fkey'
    ) THEN
        ALTER TABLE "blog_posts"
            ADD CONSTRAINT "blog_posts_instance_id_fkey"
            FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
