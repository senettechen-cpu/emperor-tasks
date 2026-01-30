import { useEffect, useRef } from 'react';
import { Task } from '../types';

export const useLocalNotifications = (tasks: Task[]) => {
    const notifiedTaskIds = useRef<Set<string>>(new Set());

    // 1. Request Permission on Mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // 2. Check for upcoming tasks every minute
    useEffect(() => {
        const checkTasks = () => {
            if (Notification.permission !== 'granted') return;

            const now = new Date().getTime();

            tasks.forEach(task => {
                // Skip if already notified or completed (recurrence logic handled in GameContext, here we just look at raw data)
                // For recurring tasks, logic might be tricky if the ID doesn't change. 
                // Assuming ID stays same, we might need to track 'lastNotifiedTime' instead of just ID.
                // But for now, let's keep it simple. If it's a recurring task, we might need a composite key or reset the Set daily.

                const dueDate = new Date(task.dueDate).getTime();
                const timeDiff = dueDate - now;
                const minutesLeft = timeDiff / (1000 * 60);

                // Condition: 0 < mins <= 10 AND not notified yet
                if (minutesLeft > 0 && minutesLeft <= 10) {
                    // Unique key for recurring tasks: ID + Date string to allow re-notification next day
                    const uniqueKey = `${task.id}-${new Date(task.dueDate).toDateString()}`;

                    if (!notifiedTaskIds.current.has(uniqueKey)) {
                        // Fire Notification
                        new Notification(`⚠️ 異端逼近警告: ${task.title}`, {
                            body: `剩餘時間: ${Math.ceil(minutesLeft)} 分鐘。請立即執行淨化協議。`,
                            icon: '/pwa-192x192.png', // Assuming pwa icon exists, or fallback
                            tag: uniqueKey // Prevent duplicates by tag
                        });

                        // Mark as notified
                        notifiedTaskIds.current.add(uniqueKey);
                    }
                }
            });
        };

        const timer = setInterval(checkTasks, 60000); // Check every 60s
        checkTasks(); // Check immediately

        return () => clearInterval(timer);
    }, [tasks]);
};
