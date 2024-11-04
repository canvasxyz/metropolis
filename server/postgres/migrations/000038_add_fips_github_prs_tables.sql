CREATE TABLE fip_versions (
  -- we can't use a composite key with (fip_number, github_pr_id) because
  -- fip_number or github_pr_id can be null
  -- so we just randomly generate a primary key
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- this is the "logical" key, in that this is what we will actually be using to
  -- look up fips
  fip_number INTEGER DEFAULT null,
  github_pr_id INTEGER DEFAULT NULL,
  UNIQUE NULLS NOT DISTINCT (fip_number, github_pr_id),

  -- the fip data
  fip_author text,
  fip_content text,
  fip_category character varying(255),
  fip_created character varying(255),
  fip_discussions_to character varying(255),
  fip_files_created text,
  fip_files_updated text,
  fip_status character varying(255),
  fip_title text,
  fip_type character varying(255)
);


CREATE TABLE github_prs (
  -- the pr id on github
  id INTEGER PRIMARY KEY,

  -- github PR metadata
  title character varying(255),
  is_draft boolean default false,
  closed_at character varying(255),
  merged_at character varying(255),
  opened_at character varying(255),
  updated_at character varying(255),
  submitter character varying(255),
  branch_name character varying(255),
  repo_name character varying(255),
  repo_owner character varying(255),
  sync_enabled boolean default true
);

-- unsure what this does if github_pr_id is null
ALTER TABLE fip_versions ADD CONSTRAINT fip_versions_github_pr_id_fkey FOREIGN KEY (github_pr_id) REFERENCES github_prs (id);
