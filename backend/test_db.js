import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log('Connecting to:', process.env.SUPABASE_URL);
    const timer = setTimeout(() => {
        console.error('Timeout reached');
        process.exit(1);
    }, 10000);

    const { data, error } = await supabase.from('profiles').select('id, full_name, role').limit(1);
    clearTimeout(timer);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Profiles Found:', data?.length || 0);
        console.log(JSON.stringify(data, null, 2));
    }
    process.exit(0);
}

test();
