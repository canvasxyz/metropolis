-- add columns for storing information about the source of a conversation
-- if it originates in a github PR
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS github_pr_opened_at VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS github_pr_updated_at VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS github_pr_closed_at VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS github_pr_merged_at VARCHAR(255);
