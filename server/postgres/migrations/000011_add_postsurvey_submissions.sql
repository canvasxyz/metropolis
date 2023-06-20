-- Polis to plusplus migrations.

ALTER TABLE conversations
ADD COLUMN postsurvey_submissions INTEGER;
