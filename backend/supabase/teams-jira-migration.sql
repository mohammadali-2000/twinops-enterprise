-- Run once in the Supabase SQL Editor for an existing TwinOps database.
-- Adds the providers/sources required by the real Teams and Jira connectors.
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_source_check;
ALTER TABLE memories ADD CONSTRAINT memories_source_check
  CHECK (source IN ('slack', 'teams', 'notion', 'github', 'gdrive', 'email', 'jira', 'voice', 'conversation', 'manual'));

ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;
ALTER TABLE integrations ADD CONSTRAINT integrations_provider_check
  CHECK (provider IN ('slack', 'teams', 'github', 'notion', 'google_drive', 'jira', 'email'));
