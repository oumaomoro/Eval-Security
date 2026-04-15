-- Implementation for Slack / Teams Webhook Notifications (Feature Option C)

CREATE TABLE IF NOT EXISTS notification_channels (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'slack', 'teams', 'webhook'
    webhook_url TEXT NOT NULL,
    events TEXT[] DEFAULT '{}', -- e.g. ['contract_uploaded', 'risk_alert', 'audit_completed']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for notification_channels
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view channels for their client"
    ON notification_channels
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.client_id = notification_channels.client_id
            AND users.id = auth.uid()
        )
        OR 
        (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    );

CREATE POLICY "Admins can manage channels for their client"
    ON notification_channels
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.client_id = notification_channels.client_id
            AND users.id = auth.uid()
            AND users.role = 'admin'
        )
        OR 
        (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    );
