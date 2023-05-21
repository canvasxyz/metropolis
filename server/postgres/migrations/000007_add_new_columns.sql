-- Polis to plusplus migrations.

ALTER TABLE conversations
ADD COLUMN is_archived BOOLEAN;
