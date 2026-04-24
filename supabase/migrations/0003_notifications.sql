-- Implementation for Slack / Teams Webhook Notifications (Feature Option C)

CREATE TABLE IF NOT EXISTS notification_channels (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'slack', 'teams', 'webhook'
    webhook_url TEXT NOT NULL,
    events TEXT[] DEFAULT '{}', -- e.g. ['contract_uploaded', 'risk_alert', 'audit_completed']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure mandatory columns exist even if table was created in a previous failed run
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_channels' AND column_name='workspace_id') THEN
        ALTER TABLE notification_channels ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_channels' AND column_name='client_id') THEN
        ALTER TABLE notification_channels ADD COLUMN client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- RLS Policies for notification_channels
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view channels for their client"
    ON notification_channels
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.client_id = notification_channels.client_id
            AND profiles.id = auth.uid()
        )
        OR 
        (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    );

CREATE POLICY "Admins can manage channels for their client"
    ON notification_channels
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.client_id = notification_channels.client_id
            AND profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
        OR 
        (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    );
