/*
  Warnings:

  - The primary key for the `object` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `payment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `object` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "object" DROP CONSTRAINT "object_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "object_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "payment" DROP CONSTRAINT "payment_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "payment_pkey" PRIMARY KEY ("id");
