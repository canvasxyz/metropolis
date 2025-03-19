import { FipVersion } from "../util/types"

export type ConversationSummary = {
  fip_version: FipVersion | null
  participant_count: number
  comment_count: number | null
  sentiment_count: number | null
  view_count: number | null
  topic: string | null
  is_archived: boolean
  is_hidden: boolean
  is_owner: boolean
  owner: number
  conversation_id: string
  created: number
  description: string | null
  help_type: number
  postsurvey: string | null
  postsurvey_limit: string | null
  postsurvey_redirect: string | null
  auth_needed_to_write: boolean
  tags: string | null
}
