"use client";

import { useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from "recharts";
import { BarChart3, TrendingUp, Award, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useWorkouts } from "@/hooks/useWorkouts";
import { startOfWeek, format, subWeeks, isSameWeek } from "date-fns";

// ============================================
// Progress Page (Charts & PRs)
// ============================================

export default function ProgressPage() {
    const { sessions, personalRecords, isLoading } = useWorkouts();
    const [period, setPeriod] = useState<"Month" | "3 Months" | "Year">("Month");

    // 1. Prepare Volume Data (Weekly)
    const volumeData = useMemo(() => {
        if (!sessions.length) return [];

        const weeksToShow = period === "Month" ? 4 : period === "3 Months" ? 12 : 12;

        const data = [];
        const now = new Date();

        for (let i = weeksToShow - 1; i >= 0; i--) {
            const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
            const weekLabel = format(weekStart, "MMM d");

            const volume = sessions
                .filter(s => {
                    const d = s.date?.toDate ? s.date.toDate() : new Date((s.date as any).seconds * 1000);
                    return isSameWeek(d, weekStart, { weekStartsOn: 1 });
                })
                .reduce((acc, s) => {
                    return acc + s.exercises.reduce((eAcc, ex) =>
                        eAcc + ex.sets.reduce((sAcc, set) => sAcc + (set.reps * set.weight), 0), 0
                    );
                }, 0);

            data.push({
                name: weekLabel,
                volume: Math.round(volume / 1000)
            });
        }
        return data;
    }, [sessions, period]);

    // 2. Prepare PR List
    const prs = useMemo(() => {
        return [...personalRecords].sort((a, b) => {
            const dA = a.date?.toDate ? a.date.toDate() : new Date((a.date as any).seconds * 1000);
            const dB = b.date?.toDate ? b.date.toDate() : new Date((b.date as any).seconds * 1000);
            return dB.getTime() - dA.getTime();
        });
    }, [personalRecords]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Progress</h1>
                <p className="text-sm text-muted-foreground">
                    Track your fitness journey with charts and milestones
                </p>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Volume Over Time */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Weekly Volume (k kg)
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            {isLoading ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : volumeData.length > 0 && volumeData.some(d => d.volume > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={volumeData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                            cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                        />
                                        <Bar dataKey="volume" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                                    <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                                    <p>No volume data yet</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* PR History */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-accent" />
                                Personal Records
                            </CardTitle>
                            <Badge variant="default">{prs.length} Records</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto max-h-[350px]">
                        {isLoading ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : prs.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <Award className="h-12 w-12 mb-4 opacity-50" />
                                <p>Log workouts to set new records!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {prs.map((pr, i) => (
                                    <div key={i} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                                                <Award className="h-5 w-5 text-accent" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {pr.exerciseName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {pr.date?.toDate ? pr.date.toDate().toLocaleDateString() : "Just now"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-foreground">
                                                {pr.weight} <span className="text-xs font-normal text-muted-foreground">kg</span>
                                            </span>
                                            <div className="text-xs text-muted-foreground">
                                                {pr.reps} reps
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Note: More charts can be added here (e.g. Frequency Heatmap, Strength Line Chart) */}
        </div>
    );
}
