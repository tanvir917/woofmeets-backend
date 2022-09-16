-- AlterTable
ALTER TABLE "MiscellaneousPayments" ALTER COLUMN "billingDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserSubscriptionInvoices" ALTER COLUMN "billingDate" DROP NOT NULL;
