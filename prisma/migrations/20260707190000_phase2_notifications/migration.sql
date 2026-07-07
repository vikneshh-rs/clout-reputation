-- AlterEnum
ALTER TYPE "NotificationProvider" ADD VALUE 'RESEND';
ALTER TYPE "NotificationProvider" ADD VALUE 'SMTP';

-- AlterTable
ALTER TABLE "NotificationJob" ADD COLUMN     "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "processingTimeMs" INTEGER,
ADD COLUMN     "providerStatus" TEXT,
ADD COLUMN     "providerResponse" JSONB;

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "eventType" "NotificationEvent" NOT NULL DEFAULT 'NEGATIVE_REVIEW',
ADD COLUMN     "notificationType" "NotificationType" NOT NULL DEFAULT 'WHATSAPP',
ADD COLUMN     "processingDuration" INTEGER;

-- CreateTable
CREATE TABLE "BusinessNotificationSettings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "negativeReviewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "positiveReviewEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dailySummaryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklySummaryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',

    CONSTRAINT "BusinessNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessNotificationSettings_businessId_key" ON "BusinessNotificationSettings"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationJob_reviewId_eventType_notificationType_key" ON "NotificationJob"("reviewId", "eventType", "notificationType");

-- AddForeignKey
ALTER TABLE "BusinessNotificationSettings" ADD CONSTRAINT "BusinessNotificationSettings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
