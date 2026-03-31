import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment FIRST
dotenv.config({ path: join(__dirname, '../backend/.env') });

async function verifyEmailDispatch() {
    console.log('--- Production Email Dispatch Check ---');
    
    // Dynamic import to ensure process.env is populated
    const { EmailService } = await import('../backend/services/email.service.js');
    
    const testEmail = 'file75556@gmail.com'; 
    const testName = 'Test Optimizor';

    try {
        console.log(`Attempting to queue welcome email for ${testEmail}...`);
        const queueEntry = await EmailService.sendWelcomeEmail(testEmail, testName);
        console.log(`Success! Queued as Entry ID: ${queueEntry.id}`);

        console.log('Triggering manual queue processing...');
        const result = await EmailService.processQueue();
        
        if (result.success && result.processed > 0) {
            console.log('Dispatch SUCCESS: The email has been sent via Resend API.');
        } else if (result.success && result.processed === 0) {
            console.log('Dispatch WARNING: No emails were processed. Check the Supabase email_queue status.');
        } else {
            console.log(`Dispatch FAILURE: ${result.error}`);
        }
    } catch (err) {
        console.error('CRITICAL ERROR during dispatch test:', err.message);
    }
}

verifyEmailDispatch();
