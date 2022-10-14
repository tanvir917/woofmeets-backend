-- CreateTable
CREATE TABLE "Coupons" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "minSpent" DOUBLE PRECISION,
    "maxCapPerUse" DOUBLE PRECISION,
    "maxLimitPerUser" INTEGER,
    "totalUsed" INTEGER DEFAULT 0,
    "expriesAt" TIMESTAMPTZ(3),
    "createdBy" BIGINT,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponUsers" (
    "id" BIGSERIAL NOT NULL,
    "couponId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "maxUse" INTEGER,
    "count" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CouponUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponTrack" (
    "id" BIGSERIAL NOT NULL,
    "couponId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "appointmentId" BIGINT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CouponTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupons_code_key" ON "Coupons"("code");

-- AddForeignKey
ALTER TABLE "Coupons" ADD CONSTRAINT "Coupons_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsers" ADD CONSTRAINT "CouponUsers_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsers" ADD CONSTRAINT "CouponUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponTrack" ADD CONSTRAINT "CouponTrack_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponTrack" ADD CONSTRAINT "CouponTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponTrack" ADD CONSTRAINT "CouponTrack_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
