-- Polis to plusplus migrations.

ALTER TABLE conversations
ADD COLUMN postsurvey VARCHAR(1024);

ALTER TABLE conversations
ADD COLUMN postsurvey_limit INTEGER;
