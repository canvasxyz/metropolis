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

export type RootState = {
  conversations: any
  user: any
  signout: any
  signin: any
  zid_metadata: any
  seed_comments_tweet: any
  mod_comments_rejected: any
  mod_comments_accepted: any
  mod_comments_unmoderated: any
  seed_comments: any
  stats: any
}

export type Conversation = {
  conversation_id: string
  is_archived: boolean
  topic: string
  description: string
  // TODO ...
}
