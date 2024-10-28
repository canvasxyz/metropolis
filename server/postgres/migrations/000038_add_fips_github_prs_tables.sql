CREATE TABLE fip_versions (
  -- we can't use a composite key with (fip_number, github_pr_id) because
  -- fip_number or github_pr_id can be null
  -- so we just randomly generate a primary key
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- this is the "logical" key, in that this is what we will actually be using to
  -- look up fips
  fip_number INTEGER DEFAULT null,
  github_pr_id INTEGER DEFAULT null,
  UNIQUE (fip_number, github_pr_id),

  -- the fip data
  fip_author text,
  fip_category character varying(255),
  fip_created character varying(255),
  fip_discussions_to character varying(255),
  fip_files_created text,
  fip_files_updated text,
  fip_status character varying(255),
  fip_title text,
  fip_type character varying(255),

  -- the github pr data
  github_branch_name character varying(255),
  github_pr_closed_at character varying(255),
  github_pr_is_draft boolean default false,
  github_pr_merged_at character varying(255),
  github_pr_opened_at character varying(255),
  github_pr_submitter character varying(255),
  github_pr_title character varying(255),
  github_pr_updated_at character varying(255),
  github_repo_name character varying(255),
  github_repo_owner character varying(255),
  github_sync_enabled boolean default true
);
