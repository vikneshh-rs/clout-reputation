-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'PERMANENTLY_FAILED');

-- CreateEnum
CREATE TYPE "NotificationProvider" AS ENUM ('TWILIO', 'META');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('NEGATIVE_REVIEW', 'POSITIVE_REVIEW', 'DAILY_SUMMARY', 'WEEKLY_REPORT');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "whatsappNumber" TEXT;

-- CreateTable
CREATE TABLE "NotificationJob" (
    "id" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "notificationType" "NotificationType" NOT NULL,
    "eventType" "NotificationEvent" NOT NULL,
    "provider" "NotificationProvider" NOT NULL,
    "recipient" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewId" TEXT,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "provider" "NotificationProvider" NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "previousStatus" "NotificationStatus" NOT NULL,
    "newStatus" "NotificationStatus" NOT NULL,
    "providerResponse" JSONB,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationJob_status_idx" ON "NotificationJob"("status");

-- CreateIndex
CREATE INDEX "NotificationJob_businessId_idx" ON "NotificationJob"("businessId");

-- CreateIndex
CREATE INDEX "NotificationJob_reviewId_idx" ON "NotificationJob"("reviewId");

-- AddForeignKey
ALTER TABLE "NotificationJob" ADD CONSTRAINT "NotificationJob_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationJob" ADD CONSTRAINT "NotificationJob_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "NotificationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the send-whatsapp Edge Function to execute every minute
SELECT cron.schedule(
  'send-whatsapp-cron',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://spvnbpysslrbhcmmutdp.functions.supabase.co/send-whatsapp',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer BearerTokenPlaceholder"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
