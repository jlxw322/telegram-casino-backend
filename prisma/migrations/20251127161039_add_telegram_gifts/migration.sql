-- CreateEnum
CREATE TYPE "TelegramGiftStatus" AS ENUM ('PENDING', 'CONVERTED', 'USED');

-- CreateEnum
CREATE TYPE "TelegramGiftType" AS ENUM ('STAR_GIFT', 'STAR_GIFT_UNIQUE');

-- CreateTable
CREATE TABLE "telegram_gifts" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "telegramMessageId" TEXT NOT NULL,
    "giftType" "TelegramGiftType" NOT NULL,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "starsValue" INTEGER,
    "nftTitle" TEXT,
    "nftNumber" TEXT,
    "nftTotalCount" TEXT,
    "nftAttributes" JSONB,
    "senderTelegramId" TEXT,
    "senderName" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "TelegramGiftStatus" NOT NULL DEFAULT 'PENDING',
    "convertedValue" INTEGER,
    "convertedAt" TIMESTAMP(3),
    "inventoryItemId" INTEGER,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "rawMessage" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_gifts_inventoryItemId_key" ON "telegram_gifts"("inventoryItemId");

-- CreateIndex
CREATE INDEX "telegram_gifts_userId_status_idx" ON "telegram_gifts"("userId", "status");

-- CreateIndex
CREATE INDEX "telegram_gifts_status_idx" ON "telegram_gifts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_gifts_telegramUserId_telegramMessageId_key" ON "telegram_gifts"("telegramUserId", "telegramMessageId");

-- AddForeignKey
ALTER TABLE "telegram_gifts" ADD CONSTRAINT "telegram_gifts_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_gifts" ADD CONSTRAINT "telegram_gifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
