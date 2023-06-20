-- Polis to plusplus migrations.

ALTER TABLE conversations
ADD COLUMN survey_caption VARCHAR(1024);

ALTER TABLE conversations
ADD COLUMN postsurvey_redirect VARCHAR(1024);
