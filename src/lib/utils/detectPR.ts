import type { WorkoutSession, PersonalRecord } from "@/types/firestore";

/**
 * GymRat AI — Auto-PR Detection
 * Checks if any exercise in a workout session sets a new personal record.
 */

interface PRDetectionResult {
    exerciseName: string;
    newWeight: number;
    newReps: number;
    previousWeight?: number;
    previousReps?: number;
    isNewPR: boolean;
}

/**
 * Compare a session's exercises against current PRs.
 * Returns a list of exercises that are new PRs.
 */
export function detectNewPRs(
    session: WorkoutSession,
    currentPRs: PersonalRecord[]
): PRDetectionResult[] {
    const results: PRDetectionResult[] = [];

    for (const exercise of session.exercises) {
        // Find the best set in this exercise (highest estimated 1RM)
        let bestWeight = 0;
        let bestReps = 0;
        let best1RM = 0;

        for (const set of exercise.sets) {
            if (set.weight > 0 && set.reps > 0) {
                const estimated = calculate1RM(set.weight, set.reps);
                if (estimated > best1RM) {
                    best1RM = estimated;
                    bestWeight = set.weight;
                    bestReps = set.reps;
                }
            }
        }

        if (best1RM === 0) continue;

        const existingPR = currentPRs.find(
            (pr) => pr.exerciseName.toLowerCase() === exercise.name.toLowerCase()
        );

        const existing1RM = existingPR
            ? calculate1RM(existingPR.weight, existingPR.reps)
            : 0;

        if (best1RM > existing1RM) {
            results.push({
                exerciseName: exercise.name,
                newWeight: bestWeight,
                newReps: bestReps,
                previousWeight: existingPR?.weight,
                previousReps: existingPR?.reps,
                isNewPR: true,
            });
        }
    }

    return results;
}

/**
 * Brzycki formula for estimated 1-rep max.
 */
function calculate1RM(weight: number, reps: number): number {
    if (reps === 1) return weight;
    if (reps <= 0 || weight <= 0) return 0;
    return weight * (36 / (37 - reps));
}
