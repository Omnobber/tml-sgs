CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS erc;
CREATE SCHEMA IF NOT EXISTS fms;

CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('sgs-erc', 'sgs-fms', 'super')),
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'engineer', 'client')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INT REFERENCES public.users(id) ON DELETE SET NULL,
  module TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erc.call_logs (
  id SERIAL PRIMARY KEY,
  reference_no TEXT NOT NULL UNIQUE,
  caller_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  location TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to INT REFERENCES public.users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  created_by INT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  vehicle_number TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erc.call_updates (
  id SERIAL PRIMARY KEY,
  call_log_id INT NOT NULL REFERENCES erc.call_logs(id) ON DELETE CASCADE,
  updated_by INT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  comment TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erc.attachments (
  id SERIAL PRIMARY KEY,
  call_log_id INT NOT NULL REFERENCES erc.call_logs(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  uploaded_by INT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erc.notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fms.call_logs (
  id SERIAL PRIMARY KEY,
  reference_no TEXT NOT NULL UNIQUE,
  caller_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  location TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to INT REFERENCES public.users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  created_by INT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  vehicle_number TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fms.call_updates (
  id SERIAL PRIMARY KEY,
  call_log_id INT NOT NULL REFERENCES fms.call_logs(id) ON DELETE CASCADE,
  updated_by INT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  comment TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fms.attachments (
  id SERIAL PRIMARY KEY,
  call_log_id INT NOT NULL REFERENCES fms.call_logs(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  uploaded_by INT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fms.notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fms.maintenance_schedules (
  id SERIAL PRIMARY KEY,
  vehicle_number TEXT NOT NULL,
  planned_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  created_by INT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erc_call_logs_status ON erc.call_logs(status);
CREATE INDEX IF NOT EXISTS idx_fms_call_logs_status ON fms.call_logs(status);
CREATE INDEX IF NOT EXISTS idx_erc_call_logs_priority ON erc.call_logs(priority);
CREATE INDEX IF NOT EXISTS idx_fms_call_logs_priority ON fms.call_logs(priority);
