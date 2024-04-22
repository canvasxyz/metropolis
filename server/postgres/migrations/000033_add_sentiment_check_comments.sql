CREATE TABLE sentiment_check_comments(
  id SERIAL,
  zid INTEGER NOT NULL REFERENCES conversations(zid),
  uid INTEGER NOT NULL REFERENCES users(uid),
  created BIGINT DEFAULT now_as_millis(),
  comment TEXT
);

CREATE INDEX sentiment_check_comments_zid_idx ON sentiment_check_comments USING btree (zid);
