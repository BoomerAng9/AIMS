-- Add password reset and metadata fields to User
ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" DATETIME;
ALTER TABLE "User" ADD COLUMN "metadata" TEXT;

-- Unique index on resetToken for fast lookup
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");
