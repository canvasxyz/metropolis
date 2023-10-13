ALTER TABLE conversations ADD CONSTRAINT conversations_github_pr_id_unique UNIQUE (github_pr_id);
