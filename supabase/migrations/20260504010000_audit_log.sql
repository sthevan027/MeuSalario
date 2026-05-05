-- Tabela de auditoria para ações sensíveis (billing, admin, auth)
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  resource    TEXT        NOT NULL,
  resource_id TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_user_id_idx    ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx     ON audit_log (action);
CREATE INDEX IF NOT EXISTS audit_log_resource_idx   ON audit_log (resource);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC);

-- Somente service_role acessa (leitura via painel admin usa admin client)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON audit_log
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE audit_log IS
  'Log imutável de ações sensíveis: billing, admin e autenticação.';

COMMENT ON COLUMN audit_log.action     IS 'Ex: checkout.initiated, subscription.canceled, user.role_changed';
COMMENT ON COLUMN audit_log.resource   IS 'Ex: subscription, profile, payment';
COMMENT ON COLUMN audit_log.resource_id IS 'ID do recurso afetado';
COMMENT ON COLUMN audit_log.metadata   IS 'Dados adicionais (sem PII sensível como senha/cartão)';
