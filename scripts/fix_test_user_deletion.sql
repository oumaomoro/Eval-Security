-- =================================================================================
-- COSTLOCI ENTERPRISE DATABASE PATCH
-- Fix for test user deletion in CI/CD pipeline
-- Adds ON DELETE CASCADE to foreign keys referencing public.profiles (users)
-- =================================================================================

DO $$ 
DECLARE
    rec RECORD;
    fk_name TEXT;
BEGIN
    -- 1. workspaces -> profiles
    FOR rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'workspaces' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%owner_id%'
    LOOP
        EXECUTE 'ALTER TABLE workspaces DROP CONSTRAINT ' || rec.constraint_name;
        EXECUTE 'ALTER TABLE workspaces ADD CONSTRAINT ' || rec.constraint_name || ' FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE';
    END LOOP;

    -- 2. subscriptions -> profiles
    FOR rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'subscriptions' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%user_id%'
    LOOP
        EXECUTE 'ALTER TABLE subscriptions DROP CONSTRAINT ' || rec.constraint_name;
        EXECUTE 'ALTER TABLE subscriptions ADD CONSTRAINT ' || rec.constraint_name || ' FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE';
    END LOOP;

    -- 3. user_playbooks -> profiles
    FOR rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'user_playbooks' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%user_id%'
    LOOP
        EXECUTE 'ALTER TABLE user_playbooks DROP CONSTRAINT ' || rec.constraint_name;
        EXECUTE 'ALTER TABLE user_playbooks ADD CONSTRAINT ' || rec.constraint_name || ' FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE';
    END LOOP;

    -- 4. presence -> profiles
    FOR rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'presence' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%user_id%'
    LOOP
        EXECUTE 'ALTER TABLE presence DROP CONSTRAINT ' || rec.constraint_name;
        EXECUTE 'ALTER TABLE presence ADD CONSTRAINT ' || rec.constraint_name || ' FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE';
    END LOOP;

    -- 5. comments -> profiles
    FOR rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'comments' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%user_id%'
    LOOP
        EXECUTE 'ALTER TABLE comments DROP CONSTRAINT ' || rec.constraint_name;
        EXECUTE 'ALTER TABLE comments ADD CONSTRAINT ' || rec.constraint_name || ' FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE';
    END LOOP;

END $$;
