-- CreateTable
CREATE TABLE "DraftProspect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "conference" TEXT,
    "classYear" TEXT NOT NULL,
    "eligibility" TEXT,
    "height" TEXT,
    "weight" INTEGER,
    "armLength" TEXT,
    "handSize" TEXT,
    "fortyYard" REAL,
    "benchPress" INTEGER,
    "verticalJump" REAL,
    "broadJump" INTEGER,
    "threeCone" REAL,
    "shuttle" REAL,
    "paiScore" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'DAY_3',
    "performance" INTEGER NOT NULL DEFAULT 0,
    "athleticism" INTEGER NOT NULL DEFAULT 0,
    "intangibles" INTEGER NOT NULL DEFAULT 0,
    "overallRank" INTEGER NOT NULL DEFAULT 9999,
    "positionRank" INTEGER NOT NULL DEFAULT 9999,
    "trend" TEXT NOT NULL DEFAULT 'NEW',
    "scoutMemo" TEXT,
    "tags" TEXT,
    "comparisons" TEXT,
    "collegeStats" TEXT,
    "seniorBowl" BOOLEAN NOT NULL DEFAULT false,
    "combineInvite" BOOLEAN NOT NULL DEFAULT false,
    "bullCase" TEXT,
    "bearCase" TEXT,
    "mediationVerdict" TEXT,
    "debateWinner" TEXT,
    "projectedRound" INTEGER,
    "projectedPick" INTEGER,
    "projectedTeam" TEXT,
    "cfbdPlayerId" INTEGER,
    "sourceUrls" TEXT,
    "lastEnriched" DATETIME,
    "enrichedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NFLTeamNeeds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamName" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "conference" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "record" TEXT,
    "draftOrder" INTEGER,
    "needs" TEXT NOT NULL,
    "capSpace" TEXT,
    "keyFAs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MockDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "rounds" INTEGER NOT NULL DEFAULT 7,
    "totalPicks" INTEGER NOT NULL DEFAULT 259,
    "generatedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DraftPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mockDraftId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "nflTeamId" TEXT,
    "overall" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "pickInRound" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "isTradeUp" BOOLEAN NOT NULL DEFAULT false,
    "tradeNote" TEXT,
    "fitScore" INTEGER,
    "rationale" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DraftPick_mockDraftId_fkey" FOREIGN KEY ("mockDraftId") REFERENCES "MockDraft" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DraftPick_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "DraftProspect" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DraftPick_nflTeamId_fkey" FOREIGN KEY ("nflTeamId") REFERENCES "NFLTeamNeeds" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DraftProspect_slug_key" ON "DraftProspect"("slug");

-- CreateIndex
CREATE INDEX "DraftProspect_tier_overallRank_idx" ON "DraftProspect"("tier", "overallRank");

-- CreateIndex
CREATE INDEX "DraftProspect_position_idx" ON "DraftProspect"("position");

-- CreateIndex
CREATE INDEX "DraftProspect_college_idx" ON "DraftProspect"("college");

-- CreateIndex
CREATE UNIQUE INDEX "NFLTeamNeeds_teamName_key" ON "NFLTeamNeeds"("teamName");

-- CreateIndex
CREATE UNIQUE INDEX "NFLTeamNeeds_abbreviation_key" ON "NFLTeamNeeds"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "MockDraft_slug_key" ON "MockDraft"("slug");

-- CreateIndex
CREATE INDEX "MockDraft_isPublished_createdAt_idx" ON "MockDraft"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "DraftPick_prospectId_idx" ON "DraftPick"("prospectId");

-- CreateIndex
CREATE INDEX "DraftPick_mockDraftId_round_idx" ON "DraftPick"("mockDraftId", "round");

-- CreateIndex
CREATE UNIQUE INDEX "DraftPick_mockDraftId_overall_key" ON "DraftPick"("mockDraftId", "overall");
