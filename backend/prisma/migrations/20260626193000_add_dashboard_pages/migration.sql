-- Enable UUID generation for backfilling default dashboard pages.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add dashboard-level configuration for future studio settings.
ALTER TABLE "dashboards" ADD COLUMN "config" JSONB;

-- Create dashboard pages for sidebar/narrative dashboard sections.
CREATE TABLE "dashboard_pages" (
    "id" UUID NOT NULL,
    "dashboard_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "dashboard_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dashboard_pages_dashboard_id_slug_key" ON "dashboard_pages"("dashboard_id", "slug");

ALTER TABLE "dashboard_pages" ADD CONSTRAINT "dashboard_pages_dashboard_id_fkey"
  FOREIGN KEY ("dashboard_id") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add page and v2 config columns to widgets while preserving chart_config compatibility.
ALTER TABLE "widgets" ADD COLUMN "page_id" UUID;
ALTER TABLE "widgets" ADD COLUMN "config_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "widgets" ADD COLUMN "data_config" JSONB;
ALTER TABLE "widgets" ADD COLUMN "visual_config" JSONB;
ALTER TABLE "widgets" ADD COLUMN "interaction_config" JSONB;

ALTER TABLE "widgets" ADD CONSTRAINT "widgets_page_id_fkey"
  FOREIGN KEY ("page_id") REFERENCES "dashboard_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill one default page per existing dashboard.
INSERT INTO "dashboard_pages" ("id", "dashboard_id", "title", "slug", "icon", "order", "config", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'Resumen', 'resumen', 'layout-dashboard', 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "dashboards";

-- Move existing widgets into the default page for their dashboard.
UPDATE "widgets"
SET "page_id" = "dashboard_pages"."id"
FROM "dashboard_pages"
WHERE "widgets"."dashboard_id" = "dashboard_pages"."dashboard_id"
  AND "dashboard_pages"."slug" = 'resumen';
