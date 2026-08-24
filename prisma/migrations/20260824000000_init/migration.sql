CREATE TYPE "MailFolder" AS ENUM ('INBOX', 'ARCHIVE', 'SPAM', 'TRASH');
CREATE TYPE "MailSource" AS ENUM ('RECEIVED', 'SENT');

CREATE TABLE "EmailState" (
  "id" TEXT NOT NULL,
  "emailId" TEXT NOT NULL,
  "source" "MailSource" NOT NULL DEFAULT 'RECEIVED',
  "folder" "MailFolder" NOT NULL DEFAULT 'INBOX',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "starred" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Label" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#7c6cf2',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailLabel" (
  "emailStateId" TEXT NOT NULL,
  "labelId" TEXT NOT NULL,
  CONSTRAINT "EmailLabel_pkey" PRIMARY KEY ("emailStateId", "labelId")
);

CREATE TABLE "Draft" (
  "id" TEXT NOT NULL,
  "to" TEXT NOT NULL DEFAULT '',
  "subject" TEXT NOT NULL DEFAULT '',
  "message" TEXT NOT NULL DEFAULT '',
  "replyToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailState_emailId_source_key" ON "EmailState"("emailId", "source");
CREATE INDEX "EmailState_folder_updatedAt_idx" ON "EmailState"("folder", "updatedAt");
CREATE INDEX "EmailState_isRead_updatedAt_idx" ON "EmailState"("isRead", "updatedAt");
CREATE INDEX "EmailState_starred_updatedAt_idx" ON "EmailState"("starred", "updatedAt");
CREATE UNIQUE INDEX "Label_name_key" ON "Label"("name");
CREATE INDEX "EmailLabel_labelId_idx" ON "EmailLabel"("labelId");
CREATE INDEX "Draft_updatedAt_idx" ON "Draft"("updatedAt");

ALTER TABLE "EmailLabel"
  ADD CONSTRAINT "EmailLabel_emailStateId_fkey"
  FOREIGN KEY ("emailStateId") REFERENCES "EmailState"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailLabel"
  ADD CONSTRAINT "EmailLabel_labelId_fkey"
  FOREIGN KEY ("labelId") REFERENCES "Label"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
