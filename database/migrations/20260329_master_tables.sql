-- Master Schema File: Client CRM, Regional Compliance, Admins

-- 1. Clients Table (CRM)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  industry TEXT,
  budget numeric,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users map to own clients" ON public.clients FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Optional: Link contracts to clients
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- 2. Regions Table (Dynamic Geofencing & Prompting Context)
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT UNIQUE NOT NULL, -- e.g. 'KE', 'AE', 'FR'
  compliance_name TEXT NOT NULL, -- e.g. 'KDPA', 'GDPR', 'PDPL'
  custom_ai_prompt TEXT NOT NULL, -- Specific system instructions loaded by AnalyzerService
  is_rtl BOOLEAN DEFAULT false
);

-- Seed basic regions
INSERT INTO public.regions (country_code, compliance_name, custom_ai_prompt, is_rtl) VALUES 
('KE', 'KDPA', 'Strictly verify compliance against Kenyan Data Protection Act and notify gaps regarding Sub-Saharan regional localization.', false),
('AE', 'PDPL', 'Strictly verify UAE Personal Data Protection Law and DGCX cyber mandates.', true),
('FR', 'GDPR', 'Strictly verify EU GDPR Article 28 parameters and standard contractual clauses.', false)
ON CONFLICT DO NOTHING;

-- 3. Webhook Events Table (Admin Audit tracking for Stripe/PayPal)
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Feedback & Bug Reports Table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  feature_request BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users assert own feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all feedback" ON public.feedback FOR SELECT TO authenticated USING (
   EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5. System Alerts Tracking 
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users map own alerts" ON public.alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
