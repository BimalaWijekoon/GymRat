import type { PlanExercise } from "@/types/firestore";

/**
 * GymRat AI — Workout Plan Parser
 * Parses structured workout plans from AI chat responses.
 */

export interface ParsedDay {
    day: string;
    exercises: PlanExercise[];
}

export interface ParsedPlan {
    name: string;
    days: ParsedDay[];
    raw: string;
}

/**
 * Detect if a chat response contains a workout plan.
 */
export function containsWorkoutPlan(text: string): boolean {
    const planIndicators = [
        /day\s*\d+/i,
        /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
        /sets?\s*[x×]\s*\d+/i,
        /\d+\s*sets?\s*[x×]\s*\d+\s*reps?/i,
        /workout\s*plan/i,
        /exercise\s*:\s*/i,
    ];

    return planIndicators.some((pattern) => pattern.test(text));
}

/**
 * Parse a workout plan from chat response text.
 * Returns exercises as PlanExercise (name, targetSets, targetReps).
 */
export function parseWorkoutPlan(text: string): ParsedPlan | null {
    if (!containsWorkoutPlan(text)) return null;

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const days: ParsedDay[] = [];
    let currentDay: ParsedDay | null = null;

    const dayPattern = /^(?:#+\s*)?(?:day\s*\d+|monday|tuesday|wednesday|thursday|friday|saturday|sunday)[\s:\-]*(.*)/i;
    const exercisePattern = /^(?:[-•*\d.]+\s*)?(.+?)[\s:\-]+(\d+)\s*(?:sets?\s*)?[x×]\s*(\d+)(?:\s*(?:reps?)?)(?:\s*@?\s*(\d+(?:\.\d+)?)\s*(?:kg|lbs?)?)?/i;

    for (const line of lines) {
        const dayMatch = line.match(dayPattern);
        if (dayMatch) {
            if (currentDay && currentDay.exercises.length > 0) {
                days.push(currentDay);
            }
            currentDay = {
                day: line.replace(/^#+\s*/, "").trim(),
                exercises: [],
            };
            continue;
        }

        if (currentDay) {
            const exMatch = line.match(exercisePattern);
            if (exMatch) {
                currentDay.exercises.push({
                    name: exMatch[1].trim(),
                    targetSets: parseInt(exMatch[2]),
                    targetReps: exMatch[3],
                });
            }
        }
    }

    if (currentDay && currentDay.exercises.length > 0) {
        days.push(currentDay);
    }

    if (days.length === 0) return null;

    return {
        name: `AI Generated Plan - ${new Date().toLocaleDateString()}`,
        days,
        raw: text,
    };
}
