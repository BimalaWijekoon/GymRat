"use client";

import {
    Dumbbell, Flame, TrendingUp, Award, Plus,
    Calendar, ChevronRight, Clock, Play
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useChat } from "@/contexts/ChatContext";
import { useWorkouts } from "@/hooks/useWorkouts";

export default function DashboardPage() {
    const { toggleChat } = useChat();
    const { stats, activePlan, sessions, personalRecords, isLoading } = useWorkouts();

    const formatDate = (date: any) => {
        if (!date) return "";
        const d = date.toDate ? date.toDate() : new Date(date.seconds ? date.seconds * 1000 : date);
        return d.toLocaleDateString();
    };

    const QUICK_STATS = [
        {
            label: "Total Sessions",
            value: stats.totalSessions.toString(),
            icon: Dumbbell,
            color: "text-primary",
            bg: "bg-primary/10",
            gradient: "from-primary/20 to-primary/5",
        },
        {
            label: "Current Streak",
            value: `${stats.currentStreak} days`,
            icon: Flame,
            color: "text-accent",
            bg: "bg-accent/10",
            gradient: "from-accent/20 to-accent/5",
        },
        {
            label: "Total Volume",
            value: `${(stats.totalVolume / 1000).toFixed(1)}k kg`,
            icon: TrendingUp,
            color: "text-secondary",
            bg: "bg-secondary/10",
            gradient: "from-secondary/20 to-secondary/5",
        },
        {
            label: "Recent PRs",
            value: stats.recentPRsCount.toString(),
            icon: Award,
            color: "text-accent",
            bg: "bg-accent/10",
            gradient: "from-accent/20 to-accent/5",
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Welcome back! Here&apos;s your fitness overview.
                    </p>
                </div>
                <Link href="/dashboard/workouts">
                    <Button className="w-fit">
                        <Play className="h-4 w-4" />
                        Start Workout
                    </Button>
                </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {QUICK_STATS.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card
                            key={i}
                            variant="default"
                            className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient}`}
                        >
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                                            {stat.label}
                                        </p>
                                        <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                                            {isLoading ? "-" : stat.value}
                                        </p>
                                    </div>
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Active Plan Card */}
            {activePlan && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardContent className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-md">
                                    <Dumbbell className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        {activePlan.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {activePlan.days.length}-day split • {activePlan.days.reduce((sum, d) => sum + d.exercises.length, 0)} total exercises
                                    </p>
                                </div>
                            </div>
                            <Link href="/dashboard/workouts">
                                <Button size="sm">
                                    <Play className="h-4 w-4" />
                                    Start Today&apos;s Workout
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Two Column Layout */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Sessions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Recent Sessions
                            </CardTitle>
                            <Link href="/dashboard/workouts">
                                <Button variant="ghost" size="sm">
                                    View All
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                                    <Dumbbell className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium text-foreground">
                                    No sessions yet
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                                    Create a workout plan and start tracking your weights!
                                </p>
                                <Link href="/dashboard/workouts">
                                    <Button className="mt-4" size="sm">
                                        <Plus className="h-4 w-4" />
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.slice(0, 3).map((session) => {
                                    const totalVolume = session.exercises.reduce((acc, ex) =>
                                        acc + ex.sets.reduce((sAcc, set) => sAcc + (set.reps * set.weight), 0), 0
                                    );
                                    return (
                                        <div key={session.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {session.dayName}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(session.date)}
                                                    <span className="mx-1">•</span>
                                                    {session.exercises.length} exercises
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-primary">
                                                    {(totalVolume / 1000).toFixed(1)}k kg
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">{session.planName}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent PRs */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-accent" />
                                Recent PRs
                            </CardTitle>
                            <Link href="/dashboard/progress">
                                <Button variant="ghost" size="sm">
                                    View All
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : personalRecords.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                                    <Award className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium text-foreground">
                                    No personal records
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                                    Your PRs will appear automatically as you track your weights!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {personalRecords.slice(0, 3).map((pr, i) => (
                                    <div key={i} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {pr.exerciseName}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDate(pr.date)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-accent">
                                                {pr.weight} kg
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {pr.reps} reps
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* AI Coach CTA */}
            {!activePlan && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardContent className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-md">
                                    <Dumbbell className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        Ready to train?
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Ask your AI coach to create a personalized workout plan
                                    </p>
                                </div>
                            </div>
                            <Button size="sm" onClick={toggleChat}>
                                Chat with AI Coach
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
