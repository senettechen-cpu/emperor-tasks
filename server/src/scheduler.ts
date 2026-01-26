
import { query } from './db';

// Scheduler Configuration
const CHECK_INTERVAL_MS = 60000; // Check every 60 seconds

export const startScheduler = () => {
    console.log('[Scheduler] Warp Corruption Engine Initialized...');

    setInterval(async () => {
        try {
            // 1. Check for Overdue Tasks
            // Logic: Find tasks that are 'active' AND overdue
            const result = await query(
                `SELECT COUNT(*) as count FROM tasks 
                 WHERE status = 'active' 
                 AND due_date < NOW()`
            );

            const overdueCount = parseInt(result.rows[0].count);

            if (overdueCount > 0) {
                console.log(`[Scheduler] Detected ${overdueCount} overdue tasks. Increasing corruption...`);

                // 2. Increase Corruption
                // Cap corruption at 100
                // Increase by 1 per overdue task (or just +1 per tick? Let's do +1 per tick if ANY are overdue, to be merciful)
                await query(
                    `UPDATE game_state 
                     SET corruption = LEAST(100, corruption + 1) 
                     WHERE id = 'global'`
                );
            }
        } catch (err) {
            console.error('[Scheduler] Error in corruption cycle:', err);
        }
    }, CHECK_INTERVAL_MS);
};
