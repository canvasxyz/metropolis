-- add columns for storing information about the source of a conversation
-- if it originates in a github PR
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS github_repo_name VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS github_repo_owner VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS github_branch_name VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS github_pr_id VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS github_pr_title VARCHAR(255);

-- fields extracted from the fip frontmatter
-- these are not guaranteed to be present or formatted in any particular way
-- treat these like free text fields
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS fip_title VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS fip_author VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS fip_discussions_to VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS fip_status VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS fip_type VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS fip_category VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS fip_created VARCHAR(255);
