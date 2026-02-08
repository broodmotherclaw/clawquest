-- Persist hex claim/challenge context for detailed history view.
ALTER TABLE "HexHistory"
  ADD COLUMN IF NOT EXISTS "questionSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedAnswer" TEXT,
  ADD COLUMN IF NOT EXISTS "challengeResult" TEXT;
