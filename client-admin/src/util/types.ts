export type User = {
  hname: string,
  email: string,
  hasFacebook: boolean,
  hasTwitter: boolean
}

export type Comment = {
  txt: string
  tid: string
  created: null | string,
  tweet_id: null | string,
  quote_src_url: null | string,
  is_seed: boolean,
  is_meta: boolean,
  lang: null | string,
  pid: string,
}
