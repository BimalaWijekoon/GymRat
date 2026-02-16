"use client";

import { useState, useEffect } from "react";
import {
    User,
    Mail,
    Ruler,
    Weight,
    Target,
    Bell,
    Moon,
    Sun,
    Save,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import type { FitnessGoal, UserProfile } from "@/types/firestore";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

// ============================================
// Profile Settings Page
// ============================================

const GOALS: { value: FitnessGoal; label: string }[] = [
    { value: "build-muscle", label: "💪 Build Muscle" },
    { value: "lose-fat", label: "🔥 Lose Fat" },
    { value: "increase-strength", label: "🏋️ Increase Strength" },
    { value: "improve-endurance", label: "🏃 Improve Endurance" },
    { value: "general-fitness", label: "❤️ General Fitness" },
    { value: "flexibility", label: "🧘 Flexibility" },
];

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [displayName, setDisplayName] = useState("");
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");
    const [selectedGoals, setSelectedGoals] = useState<FitnessGoal[]>([]);
    const [units, setUnits] = useState<"metric" | "imperial">("metric");
    const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
    const [notifications, setNotifications] = useState(true);

    // Initial Data Load
    useEffect(() => {
        if (!user) return;

        const loadProfile = async () => {
            setLoading(true);
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data() as UserProfile;
                    setDisplayName(data.displayName || user.displayName || "");
                    setWeight(data.weight?.toString() || "");
                    setHeight(data.height?.toString() || "");
                    setSelectedGoals(data.goals || []);
                    setUnits(data.preferences?.units || "metric");
                    setTheme(data.preferences?.theme || "system");
                    setNotifications(data.preferences?.notifications ?? true);
                } else {
                    // Fallback to Auth defaults
                    setDisplayName(user.displayName || "");
                }
            } catch (error) {
                console.error("Error loading profile:", error);
                toast.error("Failed to load profile settings");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const toggleGoal = (goal: FitnessGoal) => {
        setSelectedGoals((prev) =>
            prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
        );
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);

        try {
            const userRef = doc(db, "users", user.uid);

            const updates: Partial<UserProfile> = {
                displayName,
                email: user.email!, // Email usually doesn't change here
                avatarUrl: user.photoURL || undefined,
                weight: weight ? parseFloat(weight) : undefined,
                height: height ? parseFloat(height) : undefined,
                goals: selectedGoals,
                preferences: {
                    units,
                    theme,
                    notifications,
                },
                updatedAt: new Date() as any, // Firestore serverTimestamp is better, but this works for now or let updateDoc ignore type match strictly
            };

            // Using setDoc with merge: true to handle both create and update
            await setDoc(userRef, updates, { merge: true });

            toast.success("Profile saved successfully");
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and fitness preferences
                </p>
            </div>

            {/* Profile Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-border">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-2xl font-bold text-white">
                            {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">
                                {user?.displayName || "User"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {user?.email}
                            </p>
                        </div>
                    </div>

                    <Input
                        label="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label={`Weight (${units === "metric" ? "kg" : "lbs"})`}
                            type="number"
                            placeholder="75"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                        <Input
                            label={`Height (${units === "metric" ? "cm" : "in"})`}
                            type="number"
                            placeholder="175"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Fitness Goals */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-secondary" />
                        Fitness Goals
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {GOALS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => toggleGoal(value)}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${selectedGoals.includes(value)
                                    ? "bg-primary text-white shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Units */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Units</span>
                        </div>
                        <div className="flex gap-1 rounded-lg bg-muted p-1">
                            {(["metric", "imperial"] as const).map((u) => (
                                <button
                                    key={u}
                                    onClick={() => setUnits(u)}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize ${units === u ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                                        }`}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {theme === "dark" ? (
                                <Moon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Sun className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium text-foreground">Theme</span>
                        </div>
                        <div className="flex gap-1 rounded-lg bg-muted p-1">
                            {(["light", "dark", "system"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize ${theme === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                                Notifications
                            </span>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${notifications ? "bg-primary" : "bg-muted"
                                }`}
                            role="switch"
                            aria-checked={notifications}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifications ? "translate-x-5" : ""
                                    }`}
                            />
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
                <Button variant="destructive" onClick={signOut}>
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
