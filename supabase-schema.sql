-- CatchFlow Database Schema
-- Run this in Supabase SQL Editor

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT NOT NULL DEFAULT 'email', -- email | missed_call | text | manual
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'lost', 'won')),
  urgency_score INTEGER CHECK (urgency_score >= 1 AND urgency_score <= 10),
  urgency_reason TEXT,
  intent TEXT, -- quote | booking | info | complaint | other
  language TEXT DEFAULT 'en',
  summary TEXT,
  subject_line TEXT,
  suggested_reply TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-ups
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'call', 'text')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  outcome TEXT, -- completed | skipped | no_answer | bad_info
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email events (raw ingest)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_address TEXT,
  to_address TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  message_id TEXT,
  in_reply_to TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS leads_workspace_id_idx ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_urgency_score_idx ON leads(urgency_score DESC);
CREATE INDEX IF NOT EXISTS leads_last_activity_at_idx ON leads(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS follow_ups_lead_id_idx ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS follow_ups_workspace_id_idx ON follow_ups(workspace_id);
CREATE INDEX IF NOT EXISTS follow_ups_priority_idx ON follow_ups(priority);
CREATE INDEX IF NOT EXISTS email_events_workspace_id_idx ON email_events(workspace_id);
CREATE INDEX IF NOT EXISTS email_events_processed_idx ON email_events(processed);

-- Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Workspaces policies
CREATE POLICY "Users can view own workspace" ON workspaces
  FOR SELECT USING (id IN (SELECT workspace_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own workspace" ON workspaces
  FOR INSERT WITH CHECK (true);

-- Users policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Leads policies
CREATE POLICY "Users can manage own workspace leads" ON leads
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.users WHERE id = auth.uid()));

-- Follow-ups policies
CREATE POLICY "Users can manage own workspace follow_ups" ON follow_ups
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.users WHERE id = auth.uid()));

-- Email events policies
CREATE POLICY "Users can view own workspace email events" ON email_events
  FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Service role can insert email events" ON email_events
  FOR INSERT WITH CHECK (true);

-- Function: auto-create user row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, workspace_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'workspace_id', NULL)
  );
  -- Create default workspace for new user
  INSERT INTO workspaces (id, name)
  VALUES (
    gen_random_uuid(),
    COALESCE(NEW.raw_user_meta_data->>'workspace_name', NEW.email || '''s Workspace')
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: update last_activity_at on lead changes
CREATE OR REPLACE FUNCTION update_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_last_activity
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_lead_activity();
