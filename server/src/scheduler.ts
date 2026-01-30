
import { pool, query } from './db';
import webpush from 'web-push';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// VAPID Setup
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
let mailto = process.env.MAILTO || 'mailto:example@example.com';
if (!mailto.startsWith('mailto:') && !mailto.startsWith('https://')) {
    mailto = `mailto:${mailto}`;
}

if (publicVapidKey && privateVapidKey) {
    try {
        webpush.setVapidDetails(mailto, publicVapidKey, privateVapidKey);
    } catch (err) {
        console.error('[Scheduler] VAPID Setup Failed:', err);
        // Continue without VAPID
    }
} else {
    console.warn('[Scheduler] VAPID keys missing. Push notifications disabled.');
}

// Scheduler Configuration
const CHECK_INTERVAL_MS = 60000; // Check every 60 seconds

export const startScheduler = () => {
    console.log('[Scheduler] Warp Corruption Engine & Vox-Link Initialized...');

    setInterval(async () => {
        try {
            // 1. Check for Overdue Tasks (Corruption Logic)
            // Fix: Update corruption ONLY for users who have overdue tasks
            const overdueUsersResult = await query(
                `SELECT DISTINCT user_id FROM tasks 
                 WHERE status = 'active' 
                 AND due_date < NOW()
                 AND user_id IS NOT NULL`
            );

            if (overdueUsersResult.rows.length > 0) {
                const userIds = overdueUsersResult.rows.map(r => r.user_id);
                console.log(`[Scheduler] detected overdue tasks for users: ${userIds.join(', ')}`);

                // Update corruption for these users only
                // We use Postgres ANY() for array matching
                await query(
                    `UPDATE game_state 
                     SET corruption = LEAST(100, corruption + 1) 
                     WHERE user_id = ANY($1)`,
                    [userIds]
                );
            }

            // 2. Check for Upcoming Tasks (Push Notification Logic)
            // Logic: Find tasks due between NOW and NOW + 10 mins
            // AND ensure we haven't spammed them (Need a way to track notification sent? 
            // - For now, let's keep it stateless and simple: 
            //   In a real app, we'd add 'notification_sent_at' column to tasks.
            //   Let's add a quick hack: Only notify if due_date is in [now + 9m, now + 10m] window.
            //   This avoids repeat notifications every minute.
            const upcomingTasks = await query(
                `SELECT t.id, t.title, t.due_date, t.user_id 
                 FROM tasks t
                 WHERE t.status = 'active'
                 AND t.due_date > NOW() + interval '9 minutes'
                 AND t.due_date <= NOW() + interval '10 minutes'`
            );

            for (const task of upcomingTasks.rows) {
                if (!task.user_id) continue;

                // Find subscriptions for this user
                const subs = await query(
                    `SELECT * FROM push_subscriptions WHERE user_id = $1`,
                    [task.user_id]
                );

                const payload = JSON.stringify({
                    title: `⚠️ 任務臨將過期: ${task.title}`,
                    body: `距離截止僅剩 10 分鐘。盡速執行！`,
                    icon: '/pwa-192x192.png',
                    url: '/'
                });

                for (const sub of subs.rows) {
                    try {
                        const subscription = {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth
                            }
                        };
                        await webpush.sendNotification(subscription, payload);
                        console.log(`[Scheduler] Push sent to user ${task.user_id} for task ${task.id}`);
                    } catch (error: any) {
                        console.error('[Scheduler] Push failed:', error);
                        // Optional: Delete invalid subscription
                        if (error.statusCode === 410 || error.statusCode === 404) {
                            await query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
                        }
                    }
                }
            }

        } catch (err) {
            console.error('[Scheduler] Error in scheduler cycle:', err);
        }
    }, CHECK_INTERVAL_MS);
};
