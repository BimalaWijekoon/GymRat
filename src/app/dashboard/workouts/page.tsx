"use client";

import { useState, useEffect } from "react";
import {
    Plus, Dumbbell, Trash2, Play, Check, ChevronRight,
    Calendar, Clock, Star, ListChecks, History, ClipboardList
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkouts } from "@/hooks/useWorkouts";
import { db } from "@/lib/firebase/config";
import {
    collection, addDoc, doc, getDoc, setDoc, updateDoc,
    query, where, getDocs, serverTimestamp, Timestamp, writeBatch
} from "firebase/firestore";
import type {
    WorkoutPlan, PlanDay, PlanExercise,
    WorkoutSession, SessionExercise, SessionSet, PersonalRecord
} from "@/types/firestore";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

// ============================================
// Exercise Suggestions
// ============================================

const EXERCISE_SUGGESTIONS = [
    "Bench Press", "Incline Bench Press", "Dumbbell Fly",
    "Squat", "Front Squat", "Leg Press", "Leg Curl", "Leg Extension",
    "Deadlift", "Romanian Deadlift", "Barbell Row", "Lat Pulldown",
    "Overhead Press", "Lateral Raise", "Face Pull",
    "Pull-ups", "Chin-ups", "Dips",
    "Dumbbell Curl", "Hammer Curl", "Tricep Extension", "Tricep Pushdown",
    "Cable Crossover", "Calf Raise", "Hip Thrust"
];

// ============================================
// Tabs
// ============================================

type Tab = "plans" | "track" | "history";

const TABS: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
    { id: "plans", label: "My Plans", icon: ClipboardList },
    { id: "track", label: "Track", icon: Play },
    { id: "history", label: "History", icon: History },
];

// ============================================
// Main Page
// ============================================

export default function WorkoutsPage() {
    const { user } = useAuth();
    const { plans, activePlan, sessions, isLoading } = useWorkouts();
    const [activeTab, setActiveTab] = useState<Tab>("plans");

    // Auto-switch to track tab if there's an active plan
    useEffect(() => {
        if (activePlan && plans.length > 0 && sessions.length > 0) {
            // User has been using the app, default to track
        }
    }, [activePlan, plans, sessions]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Workouts</h1>
                <p className="text-sm text-muted-foreground">
                    Create plans, track your progress, and crush your goals
                </p>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-white text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            ) : (
                <>
                    {activeTab === "plans" && <PlansTab plans={plans} userId={user?.uid || ""} />}
                    {activeTab === "track" && <TrackTab activePlan={activePlan} userId={user?.uid || ""} />}
                    {activeTab === "history" && <HistoryTab sessions={sessions} />}
                </>
            )}
        </div>
    );
}

// ============================================
// Plans Tab — Create & Manage Workout Plans
// ============================================

function PlansTab({ plans, userId }: { plans: WorkoutPlan[]; userId: string }) {
    const [isCreating, setIsCreating] = useState(false);
    const [planName, setPlanName] = useState("");
    const [planDescription, setPlanDescription] = useState("");
    const [days, setDays] = useState<PlanDay[]>([
        { dayNumber: 1, name: "Day 1", exercises: [{ name: "", targetSets: 3, targetReps: "8-12" }] }
    ]);
    const [isSaving, setIsSaving] = useState(false);

    const addDay = () => {
        const nextNum = days.length + 1;
        setDays(prev => [...prev, {
            dayNumber: nextNum,
            name: `Day ${nextNum}`,
            exercises: [{ name: "", targetSets: 3, targetReps: "8-12" }]
        }]);
    };

    const removeDay = (dayIdx: number) => {
        setDays(prev => prev.filter((_, i) => i !== dayIdx).map((d, i) => ({ ...d, dayNumber: i + 1 })));
    };

    const updateDayName = (dayIdx: number, name: string) => {
        setDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, name } : d));
    };

    const addExercise = (dayIdx: number) => {
        setDays(prev => prev.map((d, i) =>
            i === dayIdx ? { ...d, exercises: [...d.exercises, { name: "", targetSets: 3, targetReps: "8-12" }] } : d
        ));
    };

    const removeExercise = (dayIdx: number, exIdx: number) => {
        setDays(prev => prev.map((d, i) =>
            i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d
        ));
    };

    const updateExercise = (dayIdx: number, exIdx: number, field: keyof PlanExercise, value: string | number) => {
        setDays(prev => prev.map((d, i) =>
            i === dayIdx ? {
                ...d,
                exercises: d.exercises.map((ex, j) =>
                    j === exIdx ? { ...ex, [field]: value } : ex
                )
            } : d
        ));
    };

    const handleSavePlan = async () => {
        if (!userId) return;
        if (!planName.trim()) { toast.error("Give your plan a name"); return; }

        const hasEmptyExercise = days.some(d => d.exercises.some(ex => !ex.name.trim()));
        if (hasEmptyExercise) { toast.error("All exercises need a name"); return; }

        setIsSaving(true);
        try {
            // Deactivate all other plans first
            const batch = writeBatch(db);
            const existing = await getDocs(query(collection(db, "workoutPlans"), where("userId", "==", userId)));
            existing.forEach(d => batch.update(d.ref, { isActive: false }));
            await batch.commit();

            await addDoc(collection(db, "workoutPlans"), {
                userId,
                name: planName.trim(),
                description: planDescription.trim() || null,
                isActive: true,
                days,
                generatedBy: "manual",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast.success("Plan created and set as active! 🎉");
            setIsCreating(false);
            setPlanName("");
            setPlanDescription("");
            setDays([{ dayNumber: 1, name: "Day 1", exercises: [{ name: "", targetSets: 3, targetReps: "8-12" }] }]);
        } catch (error) {
            console.error("Error saving plan:", error);
            toast.error("Failed to save plan");
        } finally {
            setIsSaving(false);
        }
    };

    const setActivePlan = async (planId: string) => {
        try {
            const batch = writeBatch(db);
            const existing = await getDocs(query(collection(db, "workoutPlans"), where("userId", "==", userId)));
            existing.forEach(d => batch.update(d.ref, { isActive: d.id === planId }));
            await batch.commit();
            toast.success("Active plan updated!");
        } catch (error) {
            toast.error("Failed to update plan");
        }
    };

    return (
        <div className="space-y-4">
            {/* Create Plan Button */}
            <Button onClick={() => setIsCreating(!isCreating)}>
                {isCreating ? "Cancel" : <><Plus className="h-4 w-4" /> Create Plan</>}
            </Button>

            {/* Create Plan Form */}
            {isCreating && (
                <Card className="animate-slide-up border-primary/20">
                    <CardContent className="p-5 space-y-5">
                        <h2 className="text-lg font-semibold">Create Workout Plan</h2>

                        <div className="space-y-3">
                            <Input
                                label="Plan Name"
                                placeholder="e.g. Push/Pull/Legs"
                                value={planName}
                                onChange={(e) => setPlanName(e.target.value)}
                            />
                            <Input
                                label="Description (optional)"
                                placeholder="e.g. 3-day hypertrophy split"
                                value={planDescription}
                                onChange={(e) => setPlanDescription(e.target.value)}
                            />
                        </div>

                        {/* Days */}
                        <div className="space-y-4">
                            {days.map((day, dayIdx) => (
                                <div key={dayIdx} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-white text-xs font-bold">
                                                {day.dayNumber}
                                            </div>
                                            <input
                                                value={day.name}
                                                onChange={(e) => updateDayName(dayIdx, e.target.value)}
                                                className="font-semibold text-foreground bg-transparent border-none outline-none text-sm"
                                                placeholder="Day name"
                                            />
                                        </div>
                                        {days.length > 1 && (
                                            <button onClick={() => removeDay(dayIdx)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Exercises in this day */}
                                    {day.exercises.map((ex, exIdx) => (
                                        <div key={exIdx} className="flex flex-col sm:flex-row gap-2 bg-white rounded-lg p-2.5 border border-border">
                                            <div className="flex-1">
                                                <input
                                                    list={`ex-${dayIdx}-${exIdx}`}
                                                    value={ex.name}
                                                    onChange={(e) => updateExercise(dayIdx, exIdx, "name", e.target.value)}
                                                    placeholder="Exercise name"
                                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                                                />
                                                <datalist id={`ex-${dayIdx}-${exIdx}`}>
                                                    {EXERCISE_SUGGESTIONS.map(name => <option key={name} value={name} />)}
                                                </datalist>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <div className="w-16">
                                                    <input
                                                        type="number"
                                                        value={ex.targetSets || ""}
                                                        onChange={(e) => updateExercise(dayIdx, exIdx, "targetSets", parseInt(e.target.value) || 0)}
                                                        placeholder="Sets"
                                                        className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground text-center mt-0.5">Sets</p>
                                                </div>
                                                <div className="w-20">
                                                    <input
                                                        value={ex.targetReps}
                                                        onChange={(e) => updateExercise(dayIdx, exIdx, "targetReps", e.target.value)}
                                                        placeholder="8-12"
                                                        className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground text-center mt-0.5">Reps</p>
                                                </div>
                                                {day.exercises.length > 1 && (
                                                    <button onClick={() => removeExercise(dayIdx, exIdx)} className="text-muted-foreground hover:text-destructive p-1">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <Button variant="outline" size="sm" onClick={() => addExercise(dayIdx)}>
                                        <Plus className="h-3 w-3" /> Add Exercise
                                    </Button>
                                </div>
                            ))}

                            <Button variant="outline" onClick={addDay} className="w-full">
                                <Plus className="h-4 w-4" /> Add Day
                            </Button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button className="flex-1" onClick={handleSavePlan} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save & Activate Plan"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Existing Plans */}
            {plans.length === 0 && !isCreating ? (
                <Card>
                    <CardContent className="p-10">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-5">
                                <ClipboardList className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                No workout plans yet
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-md mb-6">
                                Create a workout plan with your exercises, sets, and reps.
                                Then track your weights each session!
                            </p>
                            <Button onClick={() => setIsCreating(true)}>
                                <Plus className="h-4 w-4" /> Create Your First Plan
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {plans.map((plan) => (
                        <Card key={plan.id} className={plan.isActive ? "border-primary/40 bg-primary/5" : ""}>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{plan.name}</h3>
                                            {plan.isActive && <Badge variant="success">Active</Badge>}
                                        </div>
                                        {plan.description && (
                                            <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                                        )}
                                    </div>
                                    {!plan.isActive && (
                                        <Button variant="outline" size="sm" onClick={() => setActivePlan(plan.id)}>
                                            Set Active
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {plan.days.map((day) => (
                                        <div key={day.dayNumber} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                                            <div className="h-6 w-6 rounded-md gradient-primary text-white text-xs font-bold flex items-center justify-center">
                                                {day.dayNumber}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground text-xs">{day.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{day.exercises.length} exercises</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================
// Track Tab — Log Weights for a Plan Day
// ============================================

function TrackTab({ activePlan, userId }: { activePlan: WorkoutPlan | null; userId: string }) {
    const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null);
    const [sessionData, setSessionData] = useState<Map<string, SessionSet[]>>(new Map());
    const [isSaving, setIsSaving] = useState(false);

    // When a day is selected, initialize the tracking form
    useEffect(() => {
        if (!selectedDay) return;

        const initial = new Map<string, SessionSet[]>();
        selectedDay.exercises.forEach(ex => {
            const sets: SessionSet[] = [];
            for (let i = 1; i <= ex.targetSets; i++) {
                sets.push({ setNumber: i, reps: 0, weight: 0 });
            }
            initial.set(ex.name, sets);
        });
        setSessionData(initial);
    }, [selectedDay]);

    const updateSet = (exerciseName: string, setIdx: number, field: "reps" | "weight", value: number) => {
        setSessionData(prev => {
            const next = new Map(prev);
            const sets = [...(next.get(exerciseName) || [])];
            sets[setIdx] = { ...sets[setIdx], [field]: value };
            next.set(exerciseName, sets);
            return next;
        });
    };

    const handleSaveSession = async () => {
        if (!activePlan || !selectedDay || !userId) return;

        setIsSaving(true);
        try {
            // Build session exercises
            const exercises: SessionExercise[] = selectedDay.exercises.map(ex => ({
                name: ex.name,
                sets: sessionData.get(ex.name) || [],
            }));

            // Save to Firestore
            await addDoc(collection(db, "workoutSessions"), {
                userId,
                planId: activePlan.id,
                planName: activePlan.name,
                dayNumber: selectedDay.dayNumber,
                dayName: selectedDay.name,
                date: serverTimestamp(),
                exercises,
                createdAt: serverTimestamp(),
            });

            // Check for PRs
            const prUpdates: string[] = [];

            for (const ex of exercises) {
                // Find the best set (highest estimated 1RM)
                let bestSet: SessionSet | null = null;
                let best1RM = 0;

                for (const set of ex.sets) {
                    if (set.weight > 0 && set.reps > 0) {
                        const estimated1RM = set.weight * (36 / (37 - set.reps));
                        if (estimated1RM > best1RM) {
                            best1RM = estimated1RM;
                            bestSet = set;
                        }
                    }
                }

                if (bestSet && best1RM > 0) {
                    const safeId = ex.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
                    const prRef = doc(db, "users", userId, "personalRecords", safeId);
                    const prSnap = await getDoc(prRef);
                    const currentPR = prSnap.exists() ? (prSnap.data() as PersonalRecord) : null;
                    const old1RM = currentPR ? currentPR.weight * (36 / (37 - currentPR.reps)) : 0;

                    if (best1RM > old1RM) {
                        await setDoc(prRef, {
                            exerciseName: ex.name,
                            weight: bestSet.weight,
                            reps: bestSet.reps,
                            date: serverTimestamp(),
                            previousWeight: currentPR?.weight,
                            previousReps: currentPR?.reps,
                        });
                        prUpdates.push(ex.name);
                    }
                }
            }

            toast.success("Workout saved! 💪");
            if (prUpdates.length > 0) {
                toast.success(`🎉 New PRs: ${prUpdates.join(", ")}`);
            }

            setSelectedDay(null);
            setSessionData(new Map());
        } catch (error) {
            console.error("Error saving session:", error);
            toast.error("Failed to save workout");
        } finally {
            setIsSaving(false);
        }
    };

    if (!activePlan) {
        return (
            <Card>
                <CardContent className="p-10">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-5">
                            <Play className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No active plan</h2>
                        <p className="text-sm text-muted-foreground max-w-md mb-6">
                            Create a workout plan in the &quot;My Plans&quot; tab first, then come back here to track your weights.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Day not selected yet → show day picker
    if (!selectedDay) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">{activePlan.name}</h2>
                        <p className="text-sm text-muted-foreground">Select today&apos;s workout day</p>
                    </div>
                    <Badge variant="success">Active Plan</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {activePlan.days.map((day) => (
                        <button
                            key={day.dayNumber}
                            onClick={() => setSelectedDay(day)}
                            className="flex items-center gap-4 rounded-xl border-2 border-border bg-card p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-white font-bold shadow-md">
                                {day.dayNumber}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {day.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {day.exercises.length} exercises • {day.exercises.reduce((sum, e) => sum + e.targetSets, 0)} sets
                                </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Day selected → show tracking form
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => setSelectedDay(null)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-1 flex items-center gap-1"
                    >
                        ← Back to days
                    </button>
                    <h2 className="text-lg font-semibold">{selectedDay.name}</h2>
                    <p className="text-xs text-muted-foreground">{activePlan.name} • Day {selectedDay.dayNumber}</p>
                </div>
                <Badge>{selectedDay.exercises.length} exercises</Badge>
            </div>

            {/* Exercise Tracking Cards */}
            <div className="space-y-4">
                {selectedDay.exercises.map((ex, exIdx) => {
                    const sets = sessionData.get(ex.name) || [];
                    return (
                        <Card key={exIdx} className="overflow-hidden">
                            <div className="bg-muted/30 px-4 py-3 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Dumbbell className="h-4 w-4 text-primary" />
                                        <span className="font-semibold text-foreground">{ex.name}</span>
                                    </div>
                                    <Badge variant="default">
                                        {ex.targetSets} × {ex.targetReps}
                                    </Badge>
                                </div>
                                {ex.notes && <p className="text-xs text-muted-foreground mt-1">{ex.notes}</p>}
                            </div>
                            <CardContent className="p-3">
                                {/* Header Row */}
                                <div className="grid grid-cols-[40px_1fr_1fr] gap-2 mb-2 text-xs text-muted-foreground font-medium px-1">
                                    <span>Set</span>
                                    <span>Weight (kg)</span>
                                    <span>Reps</span>
                                </div>

                                {/* Set Rows */}
                                {sets.map((set, setIdx) => (
                                    <div key={setIdx} className="grid grid-cols-[40px_1fr_1fr] gap-2 mb-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                                            {set.setNumber}
                                        </div>
                                        <input
                                            type="number"
                                            value={set.weight || ""}
                                            onChange={(e) => updateSet(ex.name, setIdx, "weight", parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                                        />
                                        <input
                                            type="number"
                                            value={set.reps || ""}
                                            onChange={(e) => updateSet(ex.name, setIdx, "reps", parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Save Button */}
            <Button
                className="w-full h-12 text-base"
                onClick={handleSaveSession}
                disabled={isSaving}
            >
                {isSaving ? (
                    "Saving..."
                ) : (
                    <><Check className="h-5 w-5" /> Complete Workout</>
                )}
            </Button>
        </div>
    );
}

// ============================================
// History Tab — Past Sessions
// ============================================

function HistoryTab({ sessions }: { sessions: WorkoutSession[] }) {
    const formatDate = (date: any) => {
        if (!date) return "Unknown";
        if (date.toDate) return date.toDate().toLocaleDateString();
        if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
        return new Date(date).toLocaleDateString();
    };

    const formatTime = (date: any) => {
        if (!date) return "";
        const d = date.toDate ? date.toDate() : new Date(date.seconds ? date.seconds * 1000 : date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (sessions.length === 0) {
        return (
            <Card>
                <CardContent className="p-10">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-5">
                            <History className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No sessions yet</h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Your completed workouts will appear here after you track your first session.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {sessions.map((session) => {
                // Calculate session volume
                const totalVolume = session.exercises.reduce((acc, ex) =>
                    acc + ex.sets.reduce((sAcc, set) => sAcc + (set.reps * set.weight), 0), 0
                );
                const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

                return (
                    <Card key={session.id}>
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-lg">{session.dayName}</h3>
                                        <Badge variant="default" className="text-[10px]">{session.planName}</Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(session.date)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(session.date)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-primary">{(totalVolume / 1000).toFixed(1)}k kg</p>
                                    <p className="text-[10px] text-muted-foreground">{totalSets} sets</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {session.exercises.map((ex, exIdx) => {
                                    const bestSet = ex.sets.reduce((best, set) =>
                                        set.weight > (best?.weight || 0) ? set : best, ex.sets[0]
                                    );
                                    return (
                                        <div key={exIdx} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                                            <span className="font-medium text-foreground">{ex.name}</span>
                                            <span className="text-muted-foreground">
                                                {ex.sets.length} sets • Best: {bestSet?.weight || 0}kg × {bestSet?.reps || 0}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
