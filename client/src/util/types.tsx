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

export type Conversation = {
  conversation_id: string
  is_archived: boolean
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
