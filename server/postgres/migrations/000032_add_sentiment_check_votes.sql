CREATE TABLE conversation_sentiment_votes(id SERIAL, zid INTEGER NOT NULL REFERENCES conversations(zid), uid INTEGER NOT NULL REFERENCES users(uid), vote VARCHAR(10));

CREATE UNIQUE INDEX conversation_sentiment_idx ON conversation_sentiment_votes (zid, uid);
