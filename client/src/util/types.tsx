export type GitHubPr = {
  id: number
  repo_name: string
  repo_owner: string
  branch_name: string
  title: string
  submitter: string
  opened_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  is_draft: boolean | undefined
  url: string
}

export type FipVersion = {
  fip_number: number | null,
  github_pr_id: number | null,
  github_pr: GitHubPr | null,
  fip_author: string | null,
  fip_category: string | null
  fip_content: string | null,
  fip_created: string | null,
  fip_discussions_to: string | null,
  fip_files_created: string | null,
  fip_files_updated: string | null,
  fip_status: string | null,
  fip_title: string | null,
  fip_type: string | null
}

export type User = {
  hname: string
  email: string
  hasFacebook: boolean
  hasTwitter: boolean
}

export type Comment = {
  txt: string
  tid: string
  created: null | string
  tweet_id: null | string
  quote_src_url: null | string
  is_seed: boolean
  is_meta: boolean
  lang: null | string
  pid: string
  github_username: null | string
}

export type ZidMetadata = {
  auth_needed_to_vote: boolean | null
  auth_needed_to_write: boolean | null
  auth_opt_allow_3rdparty: boolean | null
  auth_opt_fb: boolean | null
  auth_opt_fb_computed: boolean | null
  auth_opt_tw: boolean | null
  auth_opt_tw_computed: boolean | null
  bgcolor: null
  branding_type: number
  context: null
  conversation_id: string
  created: string
  description: string
  email_domain: string | null
  sentiment: Sentiment[]
  comment_count: number | null
  // git fip sync
  fip_version: FipVersion
  github_sync_enabled: boolean
  /* more unused stuff */
  help_bgcolor: string | null
  help_color: string | null
  help_type: number
  /* main */
  importance_enabled: boolean
  is_active: boolean
  is_anon: boolean
  is_archived: boolean | null
  is_hidden: boolean | null
  is_data_open: boolean
  is_mod: boolean
  is_owner: boolean
  is_public: boolean
  link_url: string | null
  modified: string
  org_id: string | null
  owner: number
  ownername: string | null
  parent_url: string | null
  participant_count: number
  /* postsurvey */
  postsurvey: string | null
  postsurvey_limit: string | null
  postsurvey_redirect: string | null
  postsurvey_submissions: string | null
  prioritize_seed: boolean
  profanity_filter: boolean
  site_id: string
  socialbtn_type: number
  spam_filter: boolean
  strict_moderation: boolean
  style_btn: null
  subscribe_type: number
  survey_caption: string | null
  topic: string | null
  translations: Array<string>
  upvotes: number
  use_xid_whitelist: boolean
  vis_type: number
  write_hint_type: number
  write_type: number
}

export type Sentiment = {
  github_username: string,
  vote: string
}
