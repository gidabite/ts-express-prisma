/*
  Warnings:

  - You are about to drop the column `depth` on the `object` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `object` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cartId]` on the table `object` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ObjectStatus" AS ENUM ('NEW', 'PENDING_PAYMENT', 'PAID', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REJECTED', 'SUCCESS');

-- AlterTable
ALTER TABLE "object" DROP COLUMN "depth",
DROP COLUMN "type",
ADD COLUMN     "cartId" UUID,
ADD COLUMN     "createTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "ObjectStatus" NOT NULL DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "cartId" UUID NOT NULL,
    "createTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "object_cartId_key" ON "object"("cartId");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "object"("cartId") ON DELETE RESTRICT ON UPDATE CASCADE;
