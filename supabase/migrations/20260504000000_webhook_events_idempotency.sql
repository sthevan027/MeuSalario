-- Tabela de idempotência para webhooks
-- Garante que o mesmo evento não seja processado duas vezes (retry do Asaas, etc.)
CREATE TABLE IF NOT EXISTS webhook_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider       TEXT        NOT NULL DEFAULT 'asaas',
  event_id       TEXT        NOT NULL,
  event_type     TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'skipped', 'error')),
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  payload_hash   TEXT,
  error_message  TEXT,
  processed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT webhook_events_provider_event_id_unique UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS webhook_events_user_id_idx   ON webhook_events (user_id);
CREATE INDEX IF NOT EXISTS webhook_events_event_type_idx ON webhook_events (event_type);
CREATE INDEX IF NOT EXISTS webhook_events_processed_at_idx ON webhook_events (processed_at DESC);

-- Somente o service_role pode ler/escrever (webhooks usam admin client)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON webhook_events
  USING (false)
  WITH CHECK (false);

-- Limpeza automática de registros com mais de 90 dias (evita crescimento ilimitado)
-- Opcional: pode ser substituído por pg_cron se disponível
COMMENT ON TABLE webhook_events IS
  'Idempotência de webhooks. Registros com mais de 90 dias podem ser removidos com segurança.';

COMMENT ON COLUMN webhook_events.status IS
  'pending = inserido mas ainda não finalizado (crash-safe); '
  'processed = concluído com sucesso; '
  'skipped = evento ignorado (ex: usuário não encontrado); '
  'error = falha ao processar (será reprocessado no próximo retry).';
