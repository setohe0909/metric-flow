-- CreateTable
CREATE TABLE "sharepoint_approved_resources" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "datasource_id" UUID NOT NULL,
    "site_id" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "resource_name" TEXT NOT NULL,
    "web_url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sharepoint_approved_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sharepoint_sync_states" (
    "id" UUID NOT NULL,
    "approved_resource_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "last_started_at" TIMESTAMPTZ,
    "last_completed_at" TIMESTAMPTZ,
    "last_error" TEXT,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "delta_token" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sharepoint_sync_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sharepoint_cached_content" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "approved_resource_id" UUID NOT NULL,
    "content_type" TEXT NOT NULL,
    "row_data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sharepoint_cached_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sharepoint_approved_resources_unique_sharepoint_resource_key" ON "sharepoint_approved_resources"("organization_id", "datasource_id", "site_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "sharepoint_resources_org_datasource_idx" ON "sharepoint_approved_resources"("organization_id", "datasource_id");

-- CreateIndex
CREATE UNIQUE INDEX "sharepoint_sync_states_approved_resource_id_key" ON "sharepoint_sync_states"("approved_resource_id");

-- CreateIndex
CREATE INDEX "sharepoint_cached_content_org_resource_idx" ON "sharepoint_cached_content"("organization_id", "approved_resource_id");

-- AddForeignKey
ALTER TABLE "sharepoint_approved_resources" ADD CONSTRAINT "sharepoint_approved_resources_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sharepoint_approved_resources" ADD CONSTRAINT "sharepoint_approved_resources_datasource_id_fkey" FOREIGN KEY ("datasource_id") REFERENCES "datasources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sharepoint_sync_states" ADD CONSTRAINT "sharepoint_sync_states_approved_resource_id_fkey" FOREIGN KEY ("approved_resource_id") REFERENCES "sharepoint_approved_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sharepoint_cached_content" ADD CONSTRAINT "sharepoint_cached_content_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sharepoint_cached_content" ADD CONSTRAINT "sharepoint_cached_content_approved_resource_id_fkey" FOREIGN KEY ("approved_resource_id") REFERENCES "sharepoint_approved_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
