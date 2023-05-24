-- Polis to plusplus migrations.

ALTER TABLE participants_extended
ADD COLUMN encrypted_ip_address VARCHAR(1024);

ALTER TABLE participants_extended
ADD COLUMN encrypted_x_forwarded_for VARCHAR(1024);
