import { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import type { WorkoutPlan, WorkoutSession, PersonalRecord } from "@/types/firestore";
import { startOfWeek, subDays, isSameDay } from "date-fns";

export interface WorkoutStats {
    totalSessions: number;
    totalVolume: number;
    currentStreak: number;
    sessionsThisWeek: number;
    recentPRsCount: number;
}

export function useWorkouts() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<WorkoutStats>({
        totalSessions: 0,
        totalVolume: 0,
        currentStreak: 0,
        sessionsThisWeek: 0,
        recentPRsCount: 0,
    });

    useEffect(() => {
        if (!user) {
            setPlans([]);
            setSessions([]);
            setPersonalRecords([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // 1. Listen to Workout Plans
        const plansQuery = query(
            collection(db, "workoutPlans"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubPlans = onSnapshot(plansQuery, (snapshot) => {
            const fetchedPlans = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as WorkoutPlan[];
            setPlans(fetchedPlans);
        });

        // 2. Listen to Workout Sessions
        const sessionsQuery = query(
            collection(db, "workoutSessions"),
            where("userId", "==", user.uid),
            orderBy("date", "desc")
        );

        const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
            const fetchedSessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as WorkoutSession[];
            setSessions(fetchedSessions);
        });

        // 3. Listen to Personal Records
        const prQuery = collection(db, "users", user.uid, "personalRecords");
        const unsubPRs = onSnapshot(prQuery, (snapshot) => {
            const fetchedPRs = snapshot.docs.map(doc => ({
                ...doc.data()
            })) as PersonalRecord[];
            setPersonalRecords(fetchedPRs);
        });

        return () => {
            unsubPlans();
            unsubSessions();
            unsubPRs();
        };
    }, [user]);

    // Calculate Stats from sessions
    useEffect(() => {
        if (!sessions.length && !personalRecords.length) {
            setStats({
                totalSessions: 0,
                totalVolume: 0,
                currentStreak: 0,
                sessionsThisWeek: 0,
                recentPRsCount: 0,
            });
            setIsLoading(false);
            return;
        }

        const totalSessions = sessions.length;

        // Total volume from all sessions
        const totalVolume = sessions.reduce((acc, session) => {
            const sessionVol = session.exercises.reduce((eAcc, ex) => {
                return eAcc + ex.sets.reduce((sAcc, set) => sAcc + (set.reps * set.weight), 0);
            }, 0);
            return acc + sessionVol;
        }, 0);

        // Sessions this week
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const sessionsThisWeek = sessions.filter(s => {
            const d = s.date instanceof Timestamp ? s.date.toDate() : new Date((s.date as any).seconds * 1000);
            return d >= weekStart;
        }).length;

        // Recent PRs (last 30 days)
        const thirtyDaysAgo = subDays(now, 30);
        const recentPRsCount = personalRecords.filter(pr => {
            const d = pr.date instanceof Timestamp ? pr.date.toDate() : new Date((pr.date as any).seconds * 1000);
            return d >= thirtyDaysAgo;
        }).length;

        // Streak calculation
        const sortedDates = sessions
            .map(s => {
                const d = s.date instanceof Timestamp ? s.date.toDate() : new Date((s.date as any).seconds * 1000);
                d.setHours(0, 0, 0, 0);
                return d;
            })
            .sort((a, b) => b.getTime() - a.getTime());

        let streak = 0;
        const checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);

        const hasToday = sortedDates.some(d => isSameDay(d, checkDate));
        const startDate = hasToday ? checkDate : subDays(checkDate, 1);

        if (hasToday || sortedDates.some(d => isSameDay(d, startDate))) {
            streak = 1;
            let testDate = subDays(startDate, hasToday ? 1 : 0);
            if (!hasToday) testDate = subDays(startDate, 1);

            // Simplified: count consecutive days with sessions going backward
            let cursor = subDays(startDate, 1);
            while (sortedDates.some(d => isSameDay(d, cursor))) {
                streak++;
                cursor = subDays(cursor, 1);
            }
        }

        setStats({
            totalSessions,
            totalVolume,
            currentStreak: streak,
            sessionsThisWeek,
            recentPRsCount,
        });

        setIsLoading(false);
    }, [sessions, personalRecords]);

    // Derived: active plan
    const activePlan = plans.find(p => p.isActive) || null;

    return { plans, activePlan, sessions, personalRecords, stats, isLoading };
}
