-- CreateTable
CREATE TABLE "CoachingChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachName" TEXT NOT NULL,
    "previousRole" TEXT,
    "newRole" TEXT,
    "previousTeamId" TEXT,
    "newTeamId" TEXT,
    "changeType" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "effectiveDate" DATETIME,
    "contractYears" INTEGER,
    "contractValue" TEXT,
    "buyout" TEXT,
    "record" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoachingChange_previousTeamId_fkey" FOREIGN KEY ("previousTeamId") REFERENCES "PerformTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CoachingChange_newTeamId_fkey" FOREIGN KEY ("newTeamId") REFERENCES "PerformTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransferPortalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "eligibility" TEXT,
    "previousTeamId" TEXT,
    "newTeamId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PORTAL',
    "season" INTEGER NOT NULL,
    "enteredDate" DATETIME,
    "committedDate" DATETIME,
    "stars" INTEGER,
    "previousStats" TEXT,
    "nilValuation" TEXT,
    "paiScore" INTEGER,
    "tier" TEXT,
    "transferWindow" TEXT NOT NULL DEFAULT 'SPRING',
    "source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransferPortalEntry_previousTeamId_fkey" FOREIGN KEY ("previousTeamId") REFERENCES "PerformTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TransferPortalEntry_newTeamId_fkey" FOREIGN KEY ("newTeamId") REFERENCES "PerformTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NilDeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT,
    "position" TEXT,
    "dealType" TEXT NOT NULL,
    "brandOrCollective" TEXT,
    "estimatedValue" REAL,
    "duration" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "announcedDate" DATETIME,
    "expiresDate" DATETIME,
    "season" INTEGER NOT NULL,
    "source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NilDeal_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "PerformTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NilTeamRanking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalNilValue" REAL NOT NULL DEFAULT 0,
    "avgPerPlayer" REAL NOT NULL DEFAULT 0,
    "topDealValue" REAL NOT NULL DEFAULT 0,
    "dealCount" INTEGER NOT NULL DEFAULT 0,
    "collectiveCount" INTEGER NOT NULL DEFAULT 0,
    "trend" TEXT NOT NULL DEFAULT 'STEADY',
    "previousRank" INTEGER,
    "notes" TEXT,
    "lastCalculated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NilTeamRanking_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "PerformTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NilPlayerRanking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT,
    "position" TEXT,
    "season" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "estimatedTotal" REAL NOT NULL DEFAULT 0,
    "dealCount" INTEGER NOT NULL DEFAULT 0,
    "socialFollowing" INTEGER,
    "trend" TEXT NOT NULL DEFAULT 'STEADY',
    "previousRank" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NilPlayerRanking_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "PerformTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SchoolRevenueBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "footballRevenue" REAL NOT NULL DEFAULT 0,
    "nilBudget" REAL NOT NULL DEFAULT 0,
    "nilSpent" REAL NOT NULL DEFAULT 0,
    "nilRemaining" REAL NOT NULL DEFAULT 0,
    "coachingSalary" REAL NOT NULL DEFAULT 0,
    "operatingBudget" REAL NOT NULL DEFAULT 0,
    "scholarships" INTEGER NOT NULL DEFAULT 85,
    "walkOns" INTEGER NOT NULL DEFAULT 0,
    "rosterSize" INTEGER NOT NULL DEFAULT 0,
    "capSpace" REAL NOT NULL DEFAULT 0,
    "capRank" INTEGER,
    "spendingTier" TEXT NOT NULL DEFAULT 'MID',
    "tvRevenue" REAL NOT NULL DEFAULT 0,
    "ticketRevenue" REAL NOT NULL DEFAULT 0,
    "donorRevenue" REAL NOT NULL DEFAULT 0,
    "merchandiseRev" REAL NOT NULL DEFAULT 0,
    "conferenceShare" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SchoolRevenueBudget_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "PerformTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "playerName" TEXT,
    "category" TEXT,
    "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetTransaction_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "SchoolRevenueBudget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerformAutomationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentName" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "targetModule" TEXT NOT NULL,
    "recordsScanned" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "errors" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "durationMs" INTEGER,
    "triggeredBy" TEXT NOT NULL DEFAULT 'SCHEDULE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "CoachingChange_season_changeType_idx" ON "CoachingChange"("season", "changeType");

-- CreateIndex
CREATE INDEX "CoachingChange_coachName_idx" ON "CoachingChange"("coachName");

-- CreateIndex
CREATE INDEX "CoachingChange_newTeamId_idx" ON "CoachingChange"("newTeamId");

-- CreateIndex
CREATE INDEX "CoachingChange_previousTeamId_idx" ON "CoachingChange"("previousTeamId");

-- CreateIndex
CREATE INDEX "TransferPortalEntry_status_season_idx" ON "TransferPortalEntry"("status", "season");

-- CreateIndex
CREATE INDEX "TransferPortalEntry_position_idx" ON "TransferPortalEntry"("position");

-- CreateIndex
CREATE INDEX "TransferPortalEntry_previousTeamId_idx" ON "TransferPortalEntry"("previousTeamId");

-- CreateIndex
CREATE INDEX "TransferPortalEntry_newTeamId_idx" ON "TransferPortalEntry"("newTeamId");

-- CreateIndex
CREATE INDEX "TransferPortalEntry_transferWindow_season_idx" ON "TransferPortalEntry"("transferWindow", "season");

-- CreateIndex
CREATE INDEX "NilDeal_teamId_season_idx" ON "NilDeal"("teamId", "season");

-- CreateIndex
CREATE INDEX "NilDeal_playerName_idx" ON "NilDeal"("playerName");

-- CreateIndex
CREATE INDEX "NilDeal_dealType_idx" ON "NilDeal"("dealType");

-- CreateIndex
CREATE INDEX "NilDeal_status_idx" ON "NilDeal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NilTeamRanking_teamId_season_key" ON "NilTeamRanking"("teamId", "season");

-- CreateIndex
CREATE INDEX "NilTeamRanking_season_rank_idx" ON "NilTeamRanking"("season", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "NilPlayerRanking_playerName_season_key" ON "NilPlayerRanking"("playerName", "season");

-- CreateIndex
CREATE INDEX "NilPlayerRanking_season_rank_idx" ON "NilPlayerRanking"("season", "rank");

-- CreateIndex
CREATE INDEX "NilPlayerRanking_teamId_idx" ON "NilPlayerRanking"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolRevenueBudget_teamId_season_key" ON "SchoolRevenueBudget"("teamId", "season");

-- CreateIndex
CREATE INDEX "SchoolRevenueBudget_season_capRank_idx" ON "SchoolRevenueBudget"("season", "capRank");

-- CreateIndex
CREATE INDEX "SchoolRevenueBudget_spendingTier_idx" ON "SchoolRevenueBudget"("spendingTier");

-- CreateIndex
CREATE INDEX "BudgetTransaction_budgetId_createdAt_idx" ON "BudgetTransaction"("budgetId", "createdAt");

-- CreateIndex
CREATE INDEX "BudgetTransaction_transactionType_idx" ON "BudgetTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "PerformAutomationRun_agentName_createdAt_idx" ON "PerformAutomationRun"("agentName", "createdAt");

-- CreateIndex
CREATE INDEX "PerformAutomationRun_taskType_status_idx" ON "PerformAutomationRun"("taskType", "status");

-- CreateIndex
CREATE INDEX "PerformAutomationRun_targetModule_idx" ON "PerformAutomationRun"("targetModule");
