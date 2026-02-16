import type { WorkoutSession } from "@/types/firestore";

/**
 * GymRat AI — Workout Streak Calculation
 * Counts consecutive days with workout sessions from today backwards.
 */

/**
 * Calculate the current workout streak.
 * A streak counts consecutive days that have at least one session.
 */
export function calculateStreak(sessions: WorkoutSession[]): number {
    if (sessions.length === 0) return 0;

    // Get unique session dates (normalize to date only, no time)
    const sessionDates = new Set<string>();
    for (const session of sessions) {
        const date = session.date?.toDate ? session.date.toDate() : new Date((session.date as any).seconds * 1000);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        sessionDates.add(dateKey);
    }

    const sortedDates = Array.from(sessionDates).sort().reverse();
    if (sortedDates.length === 0) return 0;

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

    if (sortedDates[0] !== todayKey && sortedDates[0] !== yesterdayKey) {
        return 0;
    }

    let streak = 1;
    let currentDate = new Date();

    if (sortedDates[0] === yesterdayKey) {
        currentDate = yesterday;
    }

    for (let i = 1; i < 365; i++) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}-${prevDate.getDate()}`;

        if (sessionDates.has(prevKey)) {
            streak++;
            currentDate = prevDate;
        } else {
            break;
        }
    }

    return streak;
}
