-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'REP');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('RESTAURANT', 'CAFE', 'SALON', 'RESORT', 'HOTEL', 'CLINIC', 'GYM', 'SPA', 'RETAIL_STORE', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QRStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'DAMAGED', 'REPLACED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CallbackStatus" AS ENUM ('PENDING', 'CONTACTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'BASIC', 'PRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'REP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessCode" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "industry" "Industry" NOT NULL DEFAULT 'OTHER',
    "logoUrl" TEXT,
    "googleReviewUrl" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "BusinessStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "enableGoogleReviewRedirect" BOOLEAN NOT NULL DEFAULT true,
    "enableManagerCallback" BOOLEAN NOT NULL DEFAULT true,
    "createdByRepId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "requestCallback" BOOLEAN NOT NULL DEFAULT false,
    "callbackStatus" "CallbackStatus" NOT NULL DEFAULT 'PENDING',
    "redirectedToGoogle" BOOLEAN NOT NULL DEFAULT false,
    "googleCtaViewed" BOOLEAN NOT NULL DEFAULT false,
    "googleCtaClicked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallbackRequest" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" "CallbackStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'TRIAL',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRScan" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "userAgent" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRInventory" (
    "id" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "status" "QRStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "assignedBusinessId" TEXT,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3),
    "replacementQrId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentLog" (
    "id" TEXT NOT NULL,
    "qrInventoryId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRBatch" (
    "id" TEXT NOT NULL,
    "batchName" TEXT NOT NULL,
    "startSerial" TEXT NOT NULL,
    "endSerial" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Business_name_key" ON "Business"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Business_businessCode_key" ON "Business"("businessCode");

-- CreateIndex
CREATE UNIQUE INDEX "CallbackRequest_reviewId_key" ON "CallbackRequest"("reviewId");

-- CreateIndex
CREATE INDEX "QRScan_businessId_idx" ON "QRScan"("businessId");

-- CreateIndex
CREATE INDEX "QRScan_qrCode_idx" ON "QRScan"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "QRInventory_qrCode_key" ON "QRInventory"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "QRInventory_replacementQrId_key" ON "QRInventory"("replacementQrId");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_createdByRepId_fkey" FOREIGN KEY ("createdByRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallbackRequest" ADD CONSTRAINT "CallbackRequest_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRScan" ADD CONSTRAINT "QRScan_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRInventory" ADD CONSTRAINT "QRInventory_assignedBusinessId_fkey" FOREIGN KEY ("assignedBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRInventory" ADD CONSTRAINT "QRInventory_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRInventory" ADD CONSTRAINT "QRInventory_replacementQrId_fkey" FOREIGN KEY ("replacementQrId") REFERENCES "QRInventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentLog" ADD CONSTRAINT "AssignmentLog_qrInventoryId_fkey" FOREIGN KEY ("qrInventoryId") REFERENCES "QRInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentLog" ADD CONSTRAINT "AssignmentLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentLog" ADD CONSTRAINT "AssignmentLog_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRBatch" ADD CONSTRAINT "QRBatch_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
