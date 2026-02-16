import { Timestamp } from "firebase/firestore";

// ============================================
// GymRat AI — Firestore Data Schema
// ============================================

// ============================================
// User Profile
// ============================================

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    weight?: number;
    height?: number;
    age?: number;
    gender?: "male" | "female" | "other" | "prefer-not-to-say";
    goals: FitnessGoal[];
    targetWeight?: number;
    preferences: UserPreferences;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type FitnessGoal =
    | "build-muscle"
    | "lose-fat"
    | "increase-strength"
    | "improve-endurance"
    | "general-fitness"
    | "flexibility"
    | "weight-maintenance";

export interface UserPreferences {
    units: "metric" | "imperial";
    theme: "light" | "dark" | "system";
    notifications: boolean;
}

// ============================================
// Workout Plans (Templates)
// ============================================

/**
 * A workout plan is a reusable template (e.g. Push/Pull/Legs).
 * Stored in `workoutPlans/{id}`.
 */
export interface WorkoutPlan {
    id: string;
    userId: string;
    name: string;               // "Push/Pull/Legs", "Upper/Lower"
    description?: string;
    isActive: boolean;           // Only one plan active at a time
    days: PlanDay[];
    generatedBy: "manual" | "chatbot";
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * A single day in a workout plan (e.g. "Push Day").
 */
export interface PlanDay {
    dayNumber: number;           // 1, 2, 3...
    name: string;                // "Push Day", "Pull Day", "Legs"
    exercises: PlanExercise[];
}

/**
 * An exercise template within a plan day.
 * Defines what to do, not the actual logged weight.
 */
export interface PlanExercise {
    name: string;                // "Bench Press"
    targetSets: number;          // e.g. 4
    targetReps: string;          // e.g. "8-12" or "5"
    notes?: string;              // "Pause at bottom", "Use spotter"
}

// ============================================
// Workout Sessions (Daily Tracking)
// ============================================

/**
 * A single workout session — the user's actual performance log
 * for a specific day of their plan.
 * Stored in `workoutSessions/{id}`.
 */
export interface WorkoutSession {
    id: string;
    userId: string;
    planId: string;              // Links to WorkoutPlan
    planName: string;            // Denormalized for display
    dayNumber: number;           // Which day of the plan
    dayName: string;             // "Push Day"
    date: Timestamp;
    exercises: SessionExercise[];
    duration?: number;           // Minutes
    notes?: string;
    createdAt: Timestamp;
}

/**
 * An exercise's actual performance in a session.
 */
export interface SessionExercise {
    name: string;
    sets: SessionSet[];
}

/**
 * A single set's logged data.
 */
export interface SessionSet {
    setNumber: number;           // 1, 2, 3, 4
    reps: number;                // Actual reps done
    weight: number;              // Actual weight used (kg or lbs)
}

// ============================================
// Personal Records
// ============================================

/**
 * Personal record for a specific exercise.
 * Stored in `users/{uid}/personalRecords/{exerciseId}`.
 */
export interface PersonalRecord {
    exerciseName: string;
    weight: number;
    reps: number;
    date: Timestamp;
    previousWeight?: number;
    previousReps?: number;
}

// ============================================
// Chat
// ============================================

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: ChatSource[];
    timestamp: Timestamp;
}

export interface ChatSource {
    title: string;
    page?: number;
    snippet: string;
}

export interface ChatConversation {
    id: string;
    userId: string;
    messages: ChatMessage[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================
// Form Input Types
// ============================================

export interface SignupFormInput {
    email: string;
    password: string;
    confirmPassword: string;
    displayName: string;
    weight?: number;
    height?: number;
    goals: FitnessGoal[];
}

export interface LoginFormInput {
    email: string;
    password: string;
}

export interface ProfileFormInput {
    displayName: string;
    weight?: number;
    height?: number;
    age?: number;
    gender?: UserProfile["gender"];
    goals: FitnessGoal[];
    targetWeight?: number;
    preferences: UserPreferences;
}
