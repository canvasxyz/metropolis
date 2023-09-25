ALTER TABLE users
ADD COLUMN IF NOT EXISTS github_email VARCHAR(256);
ALTER TABLE users ADD CONSTRAINT users_github_email_unique UNIQUE (github_email);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS github_username VARCHAR(256);
ALTER TABLE users ADD CONSTRAINT users_github_username_unique UNIQUE (github_username);
