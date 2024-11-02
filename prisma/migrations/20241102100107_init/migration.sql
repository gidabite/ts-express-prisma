-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "depth" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_type_key" ON "Order"("type");
