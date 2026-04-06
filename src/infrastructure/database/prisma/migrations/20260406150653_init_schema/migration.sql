-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'AWAITING_CONFIRMATION', 'PREPARING', 'SHIPPING', 'DELIVERY_COMPLETED', 'DELIVERY_FAILED', 'ORDER_FAILED', 'CANCELLED', 'RETURNED', 'PAYMENT_FAILED');

-- CreateEnum
CREATE TYPE "OrderPaymentMethod" AS ENUM ('COD', 'WALLET', 'QRCODE');

-- CreateEnum
CREATE TYPE "OrderItemReturnStatus" AS ENUM ('NONE', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WALLET');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "payment_id" UUID,
    "user_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'AWAITING_CONFIRMATION',
    "payment_method" "OrderPaymentMethod" NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "receiver_name" TEXT NOT NULL,
    "receiver_phone_number" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "shipping_fee" INTEGER NOT NULL,
    "szone_voucher_discount" INTEGER NOT NULL DEFAULT 0,
    "shop_voucher_discount" INTEGER NOT NULL DEFAULT 0,
    "goods_price" INTEGER NOT NULL,
    "final_price" INTEGER NOT NULL,
    "cancel_reason" TEXT,
    "qr_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "variant_image" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "return_reason" TEXT,
    "return_status" "OrderItemReturnStatus" NOT NULL DEFAULT 'NONE',
    "return_requested_at" TIMESTAMP(3),
    "return_resolved_at" TIMESTAMP(3),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "goods_price" INTEGER NOT NULL,
    "final_price" INTEGER NOT NULL,
    "shipping_fee" INTEGER NOT NULL,
    "commission_fee" INTEGER NOT NULL,
    "payout" INTEGER NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'WALLET',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payout_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit_warehouses" (
    "id" UUID NOT NULL,
    "scanner_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "transit_warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_delivery_histories" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "ordered_at" TIMESTAMP(3),
    "dispatch_to_carrier_at" TIMESTAMP(3),
    "warehouse_history" JSONB,
    "shipper" JSONB,
    "delivery_success_at" TIMESTAMP(3),
    "delivery_fail_at" TIMESTAMP(3),

    CONSTRAINT "order_delivery_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_user_id_status_created_at_id_idx" ON "orders"("user_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "orders_shop_id_status_created_at_id_idx" ON "orders"("shop_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_return_status_order_id_idx" ON "order_items"("return_status", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_order_id_key" ON "settlements"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "transit_warehouses_scanner_id_key" ON "transit_warehouses"("scanner_id");

-- CreateIndex
CREATE UNIQUE INDEX "transit_warehouses_name_key" ON "transit_warehouses"("name");

-- CreateIndex
CREATE INDEX "order_delivery_histories_order_id_idx" ON "order_delivery_histories"("order_id");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
