-- Provider-agnostic host routing table for CDN index resolution

CREATE TABLE "domain_routes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_routes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "domain_routes_host_key" ON "domain_routes"("host");
CREATE INDEX "domain_routes_tenant_id_idx" ON "domain_routes"("tenant_id");
CREATE INDEX "domain_routes_instance_id_active_idx" ON "domain_routes"("instance_id", "active");
CREATE INDEX "domain_routes_instance_id_is_primary_idx" ON "domain_routes"("instance_id", "is_primary");
CREATE UNIQUE INDEX "domain_routes_primary_per_instance_idx" ON "domain_routes"("instance_id") WHERE "is_primary" = true;

ALTER TABLE "domain_routes"
    ADD CONSTRAINT "domain_routes_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "domain_routes"
    ADD CONSTRAINT "domain_routes_instance_id_fkey"
    FOREIGN KEY ("instance_id") REFERENCES "instances"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
