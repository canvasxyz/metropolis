CREATE TABLE github_syncs(id SERIAL, ts TIMESTAMP DEFAULT NOW(), fips_synced INTEGER, prs_synced INTEGER, discussions_synced INTEGER);
