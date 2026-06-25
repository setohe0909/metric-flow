ALTER TYPE "Role" RENAME VALUE 'owner' TO 'ADMIN';
ALTER TYPE "Role" RENAME VALUE 'admin' TO 'EDITOR';
ALTER TYPE "Role" RENAME VALUE 'viewer' TO 'READER';

ALTER TABLE "users"
ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "password_version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "disabled_at" TIMESTAMPTZ;

UPDATE "datasources"
SET "access_policies" =
    (COALESCE("access_policies", '{}'::jsonb) - 'viewer' - 'admin')
    || CASE
        WHEN "access_policies" ? 'viewer'
        THEN jsonb_build_object('READER', "access_policies" -> 'viewer')
        ELSE '{}'::jsonb
       END
    || CASE
        WHEN "access_policies" ? 'admin'
        THEN jsonb_build_object('EDITOR', "access_policies" -> 'admin')
        ELSE '{}'::jsonb
       END
WHERE "access_policies" IS NOT NULL;
