import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { supabase } from './supabase.service.js';

/**
 * LAZY LOADED REGISTRY: Redis/Queue initialization is deferred until the first 
 * call to ensure the module load phase is non-blocking on Vercel.
 */
let connection;
let rescannerQueue;

export const getRescannerQueue = () => {
    // Return early if we are in serverless mode and have no redis config
    if (process.env.VERCEL && !process.env.UPSTASH_REDIS_URL) {
        return null;
    }

    if (typeof rescannerQueue !== 'undefined' && rescannerQueue) return rescannerQueue;

    try {
        if (!connection) {
            connection = new IORedis(process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379', {
                maxRetriesPerRequest: null,
                connectTimeout: 5000,
                lazyConnect: true
            });
        }
        
        rescannerQueue = new Queue('RescannerQueue', {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: true
            }
        });
        return rescannerQueue;
    } catch (err) {
        console.error('[Redis] Lazy Initialization failed:', err.message);
        return null;
    }
};

// Create the Worker (This only spins up if the process allows background jobs)
export const setupRescannerWorker = () => {
    const worker = new Worker('RescannerQueue', async job => {
        const { organization_id, payload } = job.data;
        console.log(`[BullMQ] Starting Autonomic Rescan for Org: ${organization_id}`);

        try {
            // Mocking the heavy extraction process payload
            const mockDelay = () => new Promise(resolve => setTimeout(resolve, 3000));
            await mockDelay();

            // Simulate logging a drift after analysis
            const aiScore = Math.floor(Math.random() * 10) + 85; 
            
            await supabase.from('audit_logs').insert([{
                user_id: job.data.user_id,
                organization_id,
                action: 'AUTONOMIC_RESCAN_COMPLETED',
                resource: 'compliance_engine',
                details: { status: 'success', confidence: aiScore, standard: payload.standard }
            }]);

            console.log(`[BullMQ] Successfully processed rescan for ${organization_id}`);
            return { success: true, score: aiScore };

        } catch (error) {
            console.error(`[BullMQ] Job ${job.id} failed:`, error);
            throw error;
        }
    }, { connection });

    worker.on('failed', (job, err) => {
        console.error(`[BullMQ] Rescanner Failed for job ${job.id}: ${err.message}`);
    });

    return worker;
};
