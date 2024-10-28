ALTER TABLE conversations ADD COLUMN fip_version_id INTEGER DEFAULT null;
-- foreign key
ALTER TABLE conversations ADD CONSTRAINT fip_version_id_fkey FOREIGN KEY (fip_version_id) REFERENCES fip_versions (id);

-- TODO: do we need to add a data migration here?
