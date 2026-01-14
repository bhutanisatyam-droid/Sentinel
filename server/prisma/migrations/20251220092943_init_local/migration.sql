-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "kycStatus" TEXT NOT NULL DEFAULT 'pending',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KYCRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "panNumber" TEXT,
    "idProofType" TEXT,
    "idProofNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "faceMatchScore" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KYCRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT,
    "toAccount" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'clear',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "aiExplanation" TEXT,
    "country" TEXT DEFAULT 'India',
    "reason" TEXT,
    CONSTRAINT "Transaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "KYCRecord_userId_key" ON "KYCRecord"("userId");
