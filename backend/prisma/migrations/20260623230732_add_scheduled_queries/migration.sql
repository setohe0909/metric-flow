-- CreateTable
CREATE TABLE "scheduled_queries" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "query_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cron_expression" TEXT NOT NULL,
    "recipients" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "subject" TEXT,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "last_run_at" TIMESTAMPTZ,
    "next_run_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "scheduled_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_histories" (
    "id" UUID NOT NULL,
    "scheduled_query_id" UUID NOT NULL,
    "executed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "recipients_sent" TEXT[],

    CONSTRAINT "schedule_histories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scheduled_queries" ADD CONSTRAINT "scheduled_queries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_queries" ADD CONSTRAINT "scheduled_queries_query_id_fkey" FOREIGN KEY ("query_id") REFERENCES "queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_histories" ADD CONSTRAINT "schedule_histories_scheduled_query_id_fkey" FOREIGN KEY ("scheduled_query_id") REFERENCES "scheduled_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
