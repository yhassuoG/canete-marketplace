-- ════════════════════════════════════════════════════════════════════
-- 24_audit_log.sql — Audit log table for system event tracking
-- ════════════════════════════════════════════════════════════════════
SET search_path TO canete_marketplace, public;

CREATE TABLE IF NOT EXISTS audit_log (
    id              BIGSERIAL PRIMARY KEY,
    action          VARCHAR(100)  NOT NULL,
    severity        VARCHAR(20)   NOT NULL DEFAULT 'info',   -- info | warning | error
    actor           VARCHAR(255),                              -- email or 'system' or IP
    actor_type      VARCHAR(20)   NOT NULL DEFAULT 'user',    -- user | system | anonymous
    target          VARCHAR(500),                              -- what was affected
    ip_address      VARCHAR(45),                               -- IPv4 or IPv6
    path            VARCHAR(500),                              -- API path if relevant
    method          VARCHAR(10),                               -- HTTP method if relevant
    details         TEXT,                                      -- additional JSON or text
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Index for querying by created_at descending (most recent first)
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);

-- Index for filtering by severity
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log (severity);

-- Index for filtering by action
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log (action);

-- Index for filtering by actor
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor);

COMMENT ON TABLE audit_log IS 'System audit log — tracks auth events, rate limit hits, errors, admin actions';
