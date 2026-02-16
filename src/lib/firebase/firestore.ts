import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    Timestamp,
    serverTimestamp,
    onSnapshot,
    QueryConstraint,
    DocumentData,
    Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import type {
    UserProfile,
    WorkoutSession,
    WorkoutPlan,
    PersonalRecord,
    ChatConversation,
} from "@/types/firestore";

// ============================================
// Collection References
// ============================================

const COLLECTIONS = {
    users: "users",
    workoutSessions: "workoutSessions",
    workoutPlans: "workoutPlans",
    chats: "chats",
} as const;

// ============================================
// User Profile Operations
// ============================================

export async function createUserProfile(
    uid: string,
    data: Omit<UserProfile, "uid" | "createdAt" | "updatedAt">
): Promise<void> {
    const ref = doc(db, COLLECTIONS.users, uid);
    await setDoc(ref, {
        uid,
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const ref = doc(db, COLLECTIONS.users, uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(
    uid: string,
    data: Partial<Omit<UserProfile, "uid" | "createdAt">>
): Promise<void> {
    const ref = doc(db, COLLECTIONS.users, uid);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

// ============================================
// Workout Session Operations
// ============================================

export async function createSession(
    session: Omit<WorkoutSession, "id" | "createdAt">
): Promise<string> {
    const ref = doc(collection(db, COLLECTIONS.workoutSessions));
    const id = ref.id;
    await setDoc(ref, {
        id,
        ...session,
        createdAt: serverTimestamp(),
    });
    return id;
}

export async function getSessions(
    userId: string,
    maxResults?: number
): Promise<WorkoutSession[]> {
    const constraints: QueryConstraint[] = [
        where("userId", "==", userId),
        orderBy("date", "desc"),
    ];

    if (maxResults) {
        constraints.push(firestoreLimit(maxResults));
    }

    const q = query(collection(db, COLLECTIONS.workoutSessions), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((doc) => doc.data() as WorkoutSession);
}

export function subscribeToSessions(
    userId: string,
    callback: (sessions: WorkoutSession[]) => void,
    maxResults?: number
): Unsubscribe {
    const constraints: QueryConstraint[] = [
        where("userId", "==", userId),
        orderBy("date", "desc"),
    ];

    if (maxResults) {
        constraints.push(firestoreLimit(maxResults));
    }

    const q = query(collection(db, COLLECTIONS.workoutSessions), ...constraints);

    return onSnapshot(q, (snap) => {
        const sessions = snap.docs.map((doc) => doc.data() as WorkoutSession);
        callback(sessions);
    });
}

// ============================================
// Workout Plan Operations
// ============================================

export async function savePlan(
    userId: string,
    plan: Omit<WorkoutPlan, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> {
    const ref = doc(collection(db, COLLECTIONS.workoutPlans));
    const id = ref.id;
    await setDoc(ref, {
        id,
        userId,
        ...plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return id;
}

export async function getPlans(userId: string): Promise<WorkoutPlan[]> {
    const q = query(
        collection(db, COLLECTIONS.workoutPlans),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => doc.data() as WorkoutPlan);
}

export async function deletePlan(planId: string): Promise<void> {
    const ref = doc(db, COLLECTIONS.workoutPlans, planId);
    await deleteDoc(ref);
}

// ============================================
// Personal Records Operations
// ============================================

export async function getPersonalRecords(
    userId: string
): Promise<PersonalRecord[]> {
    const ref = collection(db, COLLECTIONS.users, userId, "personalRecords");
    const snap = await getDocs(ref);
    return snap.docs.map((doc) => doc.data() as PersonalRecord);
}

export async function updatePR(
    userId: string,
    exerciseName: string,
    data: Omit<PersonalRecord, "exerciseName">
): Promise<void> {
    const docId = exerciseName.toLowerCase().replace(/\s+/g, "-");
    const ref = doc(db, COLLECTIONS.users, userId, "personalRecords", docId);
    await setDoc(
        ref,
        {
            exerciseName,
            ...data,
        },
        { merge: true }
    );
}

export async function getAllPRs(
    userId: string
): Promise<PersonalRecord[]> {
    return getPersonalRecords(userId);
}

// ============================================
// Chat Operations
// ============================================

export async function saveChatConversation(
    conversation: Omit<ChatConversation, "createdAt" | "updatedAt">
): Promise<void> {
    const ref = doc(db, COLLECTIONS.chats, conversation.id);
    await setDoc(
        ref,
        {
            ...conversation,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

export async function getChatConversation(
    conversationId: string
): Promise<ChatConversation | null> {
    const ref = doc(db, COLLECTIONS.chats, conversationId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as ChatConversation) : null;
}

export async function getUserChats(
    userId: string
): Promise<ChatConversation[]> {
    const q = query(
        collection(db, COLLECTIONS.chats),
        where("userId", "==", userId),
        orderBy("updatedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => doc.data() as ChatConversation);
}
