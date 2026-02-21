-- Add secret field to Agent for per-agent registration tokens
ALTER TABLE "Agent" ADD COLUMN "secret" TEXT;

-- Unique constraint on secret (only one agent per token hash)
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_secret_key" UNIQUE ("secret");

-- Index for fast secret lookups
CREATE INDEX "Agent_secret_idx" ON "Agent"("secret");
