-- CreateTable
CREATE TABLE "ArenaPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'ROOKIE',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "winCount" INTEGER NOT NULL DEFAULT 0,
    "totalContests" INTEGER NOT NULL DEFAULT 0,
    "winRate" REAL NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ArenaWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "totalDeposited" REAL NOT NULL DEFAULT 0,
    "totalWon" REAL NOT NULL DEFAULT 0,
    "totalSpent" REAL NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArenaWallet_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "ArenaPlayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArenaWalletTx" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "balanceAfter" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "stripePaymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArenaWalletTx_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "ArenaWallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArenaContest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "entryFee" REAL NOT NULL DEFAULT 0,
    "prizePool" REAL NOT NULL DEFAULT 0,
    "rakePercent" REAL NOT NULL DEFAULT 15,
    "maxEntries" INTEGER NOT NULL DEFAULT 100,
    "minEntries" INTEGER NOT NULL DEFAULT 2,
    "currentEntries" INTEGER NOT NULL DEFAULT 0,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "scoredAt" DATETIME,
    "contestData" TEXT NOT NULL,
    "prizeStructure" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ArenaEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contestId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "score" REAL,
    "rank" INTEGER,
    "correctCount" INTEGER,
    "totalQuestions" INTEGER,
    "payout" REAL NOT NULL DEFAULT 0,
    "entryFeePaid" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArenaEntry_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "ArenaContest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArenaEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "ArenaPlayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArenaLeaderboard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "entries" INTEGER NOT NULL DEFAULT 0,
    "earnings" REAL NOT NULL DEFAULT 0,
    "accuracy" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArenaLeaderboard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "ArenaPlayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TriviaQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL DEFAULT 'opentdb',
    "externalId" TEXT,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'multiple',
    "question" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "incorrectAnswers" TEXT NOT NULL,
    "tags" TEXT,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "timesCorrect" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PerformConference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "commissioner" TEXT,
    "hqCity" TEXT,
    "hqState" TEXT,
    "founded" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PerformTeam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolName" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "mascot" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stadium" TEXT NOT NULL,
    "stadiumCapacity" INTEGER NOT NULL DEFAULT 0,
    "colors" TEXT NOT NULL,
    "headCoach" TEXT NOT NULL,
    "headCoachSince" INTEGER NOT NULL DEFAULT 2024,
    "bio" TEXT,
    "founded" INTEGER,
    "enrollment" INTEGER,
    "conferenceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PerformTeam_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "PerformConference" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerformTeamSeason" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "confWins" INTEGER NOT NULL DEFAULT 0,
    "confLosses" INTEGER NOT NULL DEFAULT 0,
    "apRank" INTEGER,
    "cfpRank" INTEGER,
    "bowlGame" TEXT,
    "bowlResult" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PerformTeamSeason_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "PerformTeam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerformProspect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "classYear" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pool" TEXT NOT NULL DEFAULT 'HIGH_SCHOOL',
    "height" TEXT,
    "weight" INTEGER,
    "gpa" REAL,
    "paiScore" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'DEVELOPMENTAL',
    "performance" INTEGER NOT NULL DEFAULT 0,
    "athleticism" INTEGER NOT NULL DEFAULT 0,
    "intangibles" INTEGER NOT NULL DEFAULT 0,
    "nationalRank" INTEGER NOT NULL DEFAULT 9999,
    "stateRank" INTEGER NOT NULL DEFAULT 9999,
    "positionRank" INTEGER NOT NULL DEFAULT 9999,
    "trend" TEXT NOT NULL DEFAULT 'NEW',
    "previousRank" INTEGER,
    "nilEstimate" TEXT,
    "scoutMemo" TEXT,
    "tags" TEXT,
    "comparisons" TEXT,
    "stats" TEXT,
    "bullCase" TEXT,
    "bearCase" TEXT,
    "mediationVerdict" TEXT,
    "debateWinner" TEXT,
    "highlightsUrl" TEXT,
    "imageUrl" TEXT,
    "committedTeamId" TEXT,
    "commitDate" DATETIME,
    "stars" INTEGER,
    "sourceUrls" TEXT,
    "lastEnriched" DATETIME,
    "enrichedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PerformProspect_committedTeamId_fkey" FOREIGN KEY ("committedTeamId") REFERENCES "PerformTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerformContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT,
    "prospectId" TEXT,
    "prospectName" TEXT,
    "generatedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "readTimeMin" INTEGER NOT NULL DEFAULT 5,
    "tags" TEXT,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SportsPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sport" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "league" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "spread" REAL,
    "overUnder" REAL,
    "result" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ArenaPlayer_userId_key" ON "ArenaPlayer"("userId");

-- CreateIndex
CREATE INDEX "ArenaPlayer_tier_xp_idx" ON "ArenaPlayer"("tier", "xp");

-- CreateIndex
CREATE INDEX "ArenaPlayer_winRate_idx" ON "ArenaPlayer"("winRate");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaWallet_playerId_key" ON "ArenaWallet"("playerId");

-- CreateIndex
CREATE INDEX "ArenaWalletTx_walletId_createdAt_idx" ON "ArenaWalletTx"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "ArenaWalletTx_type_createdAt_idx" ON "ArenaWalletTx"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaContest_slug_key" ON "ArenaContest"("slug");

-- CreateIndex
CREATE INDEX "ArenaContest_status_startsAt_idx" ON "ArenaContest"("status", "startsAt");

-- CreateIndex
CREATE INDEX "ArenaContest_type_status_idx" ON "ArenaContest"("type", "status");

-- CreateIndex
CREATE INDEX "ArenaContest_featured_status_idx" ON "ArenaContest"("featured", "status");

-- CreateIndex
CREATE INDEX "ArenaContest_category_status_idx" ON "ArenaContest"("category", "status");

-- CreateIndex
CREATE INDEX "ArenaEntry_playerId_createdAt_idx" ON "ArenaEntry"("playerId", "createdAt");

-- CreateIndex
CREATE INDEX "ArenaEntry_contestId_score_idx" ON "ArenaEntry"("contestId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaEntry_contestId_playerId_key" ON "ArenaEntry"("contestId", "playerId");

-- CreateIndex
CREATE INDEX "ArenaLeaderboard_period_periodKey_rank_idx" ON "ArenaLeaderboard"("period", "periodKey", "rank");

-- CreateIndex
CREATE INDEX "ArenaLeaderboard_period_periodKey_score_idx" ON "ArenaLeaderboard"("period", "periodKey", "score");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaLeaderboard_playerId_period_periodKey_key" ON "ArenaLeaderboard"("playerId", "period", "periodKey");

-- CreateIndex
CREATE INDEX "TriviaQuestion_category_difficulty_idx" ON "TriviaQuestion"("category", "difficulty");

-- CreateIndex
CREATE INDEX "TriviaQuestion_source_idx" ON "TriviaQuestion"("source");

-- CreateIndex
CREATE INDEX "TriviaQuestion_timesUsed_idx" ON "TriviaQuestion"("timesUsed");

-- CreateIndex
CREATE UNIQUE INDEX "PerformConference_name_key" ON "PerformConference"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PerformConference_abbreviation_key" ON "PerformConference"("abbreviation");

-- CreateIndex
CREATE INDEX "PerformTeam_conferenceId_idx" ON "PerformTeam"("conferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformTeam_schoolName_state_key" ON "PerformTeam"("schoolName", "state");

-- CreateIndex
CREATE INDEX "PerformTeamSeason_season_idx" ON "PerformTeamSeason"("season");

-- CreateIndex
CREATE UNIQUE INDEX "PerformTeamSeason_teamId_season_key" ON "PerformTeamSeason"("teamId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "PerformProspect_slug_key" ON "PerformProspect"("slug");

-- CreateIndex
CREATE INDEX "PerformProspect_tier_nationalRank_idx" ON "PerformProspect"("tier", "nationalRank");

-- CreateIndex
CREATE INDEX "PerformProspect_position_classYear_idx" ON "PerformProspect"("position", "classYear");

-- CreateIndex
CREATE INDEX "PerformProspect_state_classYear_idx" ON "PerformProspect"("state", "classYear");

-- CreateIndex
CREATE INDEX "PerformProspect_pool_classYear_idx" ON "PerformProspect"("pool", "classYear");

-- CreateIndex
CREATE UNIQUE INDEX "PerformContent_slug_key" ON "PerformContent"("slug");

-- CreateIndex
CREATE INDEX "PerformContent_type_published_idx" ON "PerformContent"("type", "published");

-- CreateIndex
CREATE INDEX "PerformContent_createdAt_idx" ON "PerformContent"("createdAt");

-- CreateIndex
CREATE INDEX "SportsPick_sport_eventDate_idx" ON "SportsPick"("sport", "eventDate");

-- CreateIndex
CREATE INDEX "SportsPick_status_idx" ON "SportsPick"("status");
