-- Release controller database contract. This database is separate from the
-- public interaction D1 and stores no article body or user comment content.
CREATE TABLE IF NOT EXISTS builds (
  build_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  framework_sha TEXT NOT NULL,
  content_sha TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  state TEXT NOT NULL,
  run_id TEXT,
  snapshot_digest TEXT,
  search_digest TEXT,
  artifact_digest TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS releases (
  release_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  build_id TEXT NOT NULL,
  framework_sha TEXT NOT NULL,
  content_sha TEXT NOT NULL,
  snapshot_digest TEXT NOT NULL,
  search_digest TEXT NOT NULL,
  artifact_digest TEXT NOT NULL,
  artifact_location TEXT NOT NULL,
  lockfile_sha256 TEXT NOT NULL,
  theme_id TEXT NOT NULL,
  content_schema_version INTEGER NOT NULL,
  public_api_version INTEGER NOT NULL,
  admin_api_version INTEGER NOT NULL,
  required_migrations TEXT NOT NULL,
  supported_service_contract TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
  approval_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  release_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  artifact_digest TEXT NOT NULL,
  expected_current_release_id TEXT,
  production_config_digest TEXT NOT NULL,
  actor_subject TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_by_attempt_id TEXT UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deployment_attempts (
  attempt_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  release_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  state TEXT NOT NULL,
  expected_current_release_id TEXT,
  observed_release_id TEXT,
  cloudflare_version_id TEXT,
  cloudflare_deployment_id TEXT,
  retry_of TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deployment_attempts_active ON deployment_attempts(site_id) WHERE state IN ('requested', 'uploading', 'verifying', 'reconciling');

CREATE TABLE IF NOT EXISTS site_environments (
  site_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  observed_known INTEGER NOT NULL DEFAULT 0,
  observed_release_id TEXT,
  last_healthy_release_id TEXT,
  active_attempt_id TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (site_id, environment)
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  site_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (site_id, operation, idempotency_key)
);

CREATE TABLE IF NOT EXISTS execution_bindings (
  operation_id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL,
  workflow_sha TEXT NOT NULL,
  run_id TEXT,
  run_attempt INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  delivery_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  state TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  event_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  actor_subject TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  transition TEXT NOT NULL,
  result TEXT NOT NULL,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_builds_site_created ON builds(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_site_created ON deployment_attempts(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_site_created ON audit_events(site_id, created_at DESC);
