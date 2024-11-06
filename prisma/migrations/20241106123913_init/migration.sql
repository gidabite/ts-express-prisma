-- CreateEnum
CREATE TYPE "ObjectStatus" AS ENUM ('NEW', 'PENDING_PAYMENT', 'PAID', 'CANCELED', 'ERROR');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NEW', 'REJECTED', 'SUCCESS', 'REFUND');

-- CreateTable
CREATE TABLE "object" (
    "id" UUID NOT NULL,
    "createTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ObjectStatus" NOT NULL DEFAULT 'NEW',
    "trainNumber" VARCHAR(4) NOT NULL,

    CONSTRAINT "object_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'NEW',
    "createTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "objectId" UUID NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "object"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
