import type { WorkoutSession } from "@/types/firestore";

/**
 * GymRat AI — Progressive Overload Suggestions
 * Analyzes recent session history and recommends weight increases.
 */

interface OverloadSuggestion {
    exerciseName: string;
    currentWeight: number;
    suggestedWeight: number;
    reason: string;
}

/**
 * Analyze recent sessions and suggest progressive overload.
 * Rule: If user hit target reps for 3+ consecutive sessions, suggest +2.5kg.
 */
export function getSuggestedWeight(
    exerciseName: string,
    recentSessions: WorkoutSession[],
    targetReps: number = 8
): OverloadSuggestion | null {
    // Find best set for this exercise across recent sessions
    const exerciseHistory: { weight: number; reps: number; date: Date }[] = [];

    for (const session of recentSessions) {
        for (const exercise of session.exercises) {
            if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
                // Use the heaviest set as representative
                const bestSet = exercise.sets.reduce((best, set) =>
                    set.weight > (best?.weight || 0) ? set : best, exercise.sets[0]
                );
                if (bestSet && bestSet.weight > 0) {
                    const d = session.date?.toDate ? session.date.toDate() : new Date((session.date as any).seconds * 1000);
                    exerciseHistory.push({
                        weight: bestSet.weight,
                        reps: bestSet.reps,
                        date: d,
                    });
                }
            }
        }
    }

    if (exerciseHistory.length < 3) return null;

    // Check last 3 sessions
    const lastThree = exerciseHistory.slice(0, 3);
    const currentWeight = lastThree[0].weight;

    // All sessions at same weight and hit target reps
    const allHitTarget = lastThree.every(
        (e) => e.weight === currentWeight && e.reps >= targetReps
    );

    if (allHitTarget) {
        const increment = currentWeight < 20 ? 1.25 : 2.5;
        return {
            exerciseName,
            currentWeight,
            suggestedWeight: currentWeight + increment,
            reason: `You've hit ${targetReps}+ reps at ${currentWeight}kg for 3 sessions. Try ${currentWeight + increment}kg!`,
        };
    }

    return null;
}
