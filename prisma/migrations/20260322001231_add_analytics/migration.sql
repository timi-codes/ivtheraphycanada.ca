-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "referrer" TEXT,
    "referrerType" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "entryPage" TEXT NOT NULL,
    "entryMethod" TEXT,
    "deviceType" TEXT,
    "userAgent" TEXT,
    "firstCity" TEXT,
    "firstProvince" TEXT,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "hasLeadAction" BOOLEAN NOT NULL DEFAULT false,
    "leadActionType" TEXT,
    "winnerVendorId" TEXT,
    "winnerVendorName" TEXT,
    "sessionDurationSec" INTEGER,
    "pagesViewed" INTEGER NOT NULL DEFAULT 0,
    "vendorsViewed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "category" TEXT,
    "page" TEXT,
    "pageType" TEXT,
    "city" TEXT,
    "province" TEXT,
    "service" TEXT,
    "vendorId" TEXT,
    "vendorName" TEXT,
    "vendorSlug" TEXT,
    "vendorPlan" TEXT,
    "vendorRank" INTEGER,
    "query" TEXT,
    "resultCount" INTEGER,
    "hasResults" BOOLEAN,
    "scrollDepth" INTEGER,
    "timeOnPage" INTEGER,
    "sourceType" TEXT,
    "referrer" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSession_sessionId_key" ON "AnalyticsSession"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsSession_createdAt_idx" ON "AnalyticsSession"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_entryMethod_idx" ON "AnalyticsSession"("entryMethod");

-- CreateIndex
CREATE INDEX "AnalyticsSession_hasLeadAction_idx" ON "AnalyticsSession"("hasLeadAction");

-- CreateIndex
CREATE INDEX "AnalyticsSession_firstCity_idx" ON "AnalyticsSession"("firstCity");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_event_idx" ON "AnalyticsEvent"("event");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_city_idx" ON "AnalyticsEvent"("city");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_vendorId_idx" ON "AnalyticsEvent"("vendorId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_category_idx" ON "AnalyticsEvent"("category");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_pageType_idx" ON "AnalyticsEvent"("pageType");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;
