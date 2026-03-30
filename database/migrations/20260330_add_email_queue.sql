-- SQL Migration to support zero-cost email queues.
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "to" TEXT NOT NULL,
    subject TEXT NOT NULL,
    html TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    next_attempt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (Service Role Only)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
