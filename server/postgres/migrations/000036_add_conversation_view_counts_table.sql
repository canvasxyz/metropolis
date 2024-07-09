CREATE TABLE conversation_view_counts (
  zid INTEGER REFERENCES conversations(zid),
  view_count INT,
  PRIMARY KEY (zid)
);
