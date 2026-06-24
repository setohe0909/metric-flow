CREATE TABLE "installations" (
    "id" INTEGER NOT NULL,
    "initialized_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID,
    "administrator_user_id" UUID,

    CONSTRAINT "installations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "installations_singleton_check" CHECK ("id" = 1)
);

CREATE UNIQUE INDEX "installations_organization_id_key"
ON "installations"("organization_id");

CREATE UNIQUE INDEX "installations_administrator_user_id_key"
ON "installations"("administrator_user_id");

ALTER TABLE "installations"
ADD CONSTRAINT "installations_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "installations"
ADD CONSTRAINT "installations_administrator_user_id_fkey"
FOREIGN KEY ("administrator_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "installations" (
    "id",
    "organization_id",
    "administrator_user_id"
)
SELECT
    1,
    (SELECT "id" FROM "organizations" ORDER BY "created_at" ASC LIMIT 1),
    (
        SELECT membership."user_id"
        FROM "memberships" AS membership
        WHERE membership."role" = 'owner'
          AND membership."organization_id" = (
              SELECT "id"
              FROM "organizations"
              ORDER BY "created_at" ASC
              LIMIT 1
          )
        ORDER BY membership."created_at" ASC
        LIMIT 1
    )
WHERE EXISTS (SELECT 1 FROM "organizations")
   OR EXISTS (SELECT 1 FROM "users");
