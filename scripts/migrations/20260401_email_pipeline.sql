-- 1. Create email_ingestion_logs Table
CREATE TABLE IF NOT EXISTS email_ingestion_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_email TEXT NOT NULL,
  subject TEXT,
  message_id TEXT UNIQUE,
  attachment_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, success, failed
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Note: We rely on standard Supabase UUID extensions.
CREATE INDEX IF NOT EXISTS idx_email_logs_message_id ON email_ingestion_logs(message_id);

-- 2. Alter contracts table to support email_subject
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS email_subject TEXT;

-- 3. Create notifications Table for in-app UI
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable RLS for email_ingestion_logs
ALTER TABLE email_ingestion_logs ENABLE ROW LEVEL SECURITY;

-- Note: Ingestion logs are mainly backend-driven. Optional read access for users observing their own contracts:
CREATE POLICY "Users can view logs attached to their contracts"
ON email_ingestion_logs FOR SELECT
USING (contract_id IN (SELECT id FROM contracts WHERE user_id = auth.uid()));

-- 4. Supabase Storage Bucket Provisioning
-- Important: Run this through the Supabase UI or it expects you have privileges.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts', 'contracts', false) 
ON CONFLICT (id) DO NOTHING;

-- RLS Policy for bucket so authenticated users can read their own, and backend can insert.
-- The backend uses Service Role bypass, so no policy strictly needed for INSERT.
CREATE POLICY "Users can view their own contract assets" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'contracts' AND auth.uid() = owner );
