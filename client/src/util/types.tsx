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
  /* github sync */
  fip_author: string | null
  fip_category: string | null
  fip_created: string | null
  fip_discussions_to: string | null
  fip_number: string | number | null // ?
  fip_status: string | null
  fip_title: string | null
  fip_type: string | null
  github_branch_name: string | null
  github_pr_closed_at: string | null
  github_pr_id: string | null
  github_pr_merged_at: string | null
  github_pr_opened_at: string | null
  github_pr_submitter: string | null
  github_pr_title: string | null
  github_pr_updated_at: string | null
  github_pr_url: string | null
  github_repo_name: string | null
  github_repo_owner: string | null
  github_sync_enabled: boolean | null
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

export type Conversation = {
  conversation_id: string
  is_archived: boolean
  is_hidden: boolean
  is_owner: boolean
  is_mod: boolean
  topic: string
  description: string
  postsurvey: string
  postsurvey_redirect: string
  postsurvey_limit: string
  postsurvey_submissions: string
  github_sync_enabled: boolean
  github_repo_name: string
  github_repo_owner: string
  github_branch_name: string
  github_pr_id: string
  github_pr_title: string
  github_pr_submitter: string
  github_pr_url: string | null
  github_pr_opened_at: string
  github_pr_updated_at: string
  github_pr_closed_at: string
  github_pr_merged_at: string
  fip_number: number
  fip_title: string
  fip_author: string
  fip_discussions_to: string
  fip_status: string
  fip_type: string
  fip_category: string
  fip_created: string
  hname: string
  participant_count: number
  created: number
  // TODO ...
}
