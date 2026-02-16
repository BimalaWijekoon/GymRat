"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from "react";
import { User } from "firebase/auth";
import {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut as firebaseSignOut,
    resetPassword as firebaseResetPassword,
    onAuthStateChanged,
} from "@/lib/firebase/auth";
import { createUserProfile, getUserProfile } from "@/lib/firebase/firestore";

// ============================================
// Auth Context Types
// ============================================

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signUp: (
        email: string,
        password: string,
        displayName: string
    ) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogleProvider: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// Auth Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged((authUser) => {
            setUser(authUser as User | null);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const signUp = useCallback(
        async (email: string, password: string, displayName: string) => {
            try {
                setError(null);
                setLoading(true);
                const newUser = await signUpWithEmail(email, password, displayName);

                // Create user profile in Firestore
                await createUserProfile(newUser.uid, {
                    email: newUser.email || email,
                    displayName,
                    goals: [],
                    preferences: {
                        units: "metric",
                        theme: "system",
                        notifications: true,
                    },
                });
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : "Sign up failed";
                setError(message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const signIn = useCallback(
        async (email: string, password: string) => {
            try {
                setError(null);
                setLoading(true);
                await signInWithEmail(email, password);
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : "Sign in failed";
                setError(message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const signInWithGoogleProvider = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            const googleUser = await signInWithGoogle();

            // Check if profile exists, if not create one
            const existingProfile = await getUserProfile(googleUser.uid);
            if (!existingProfile) {
                await createUserProfile(googleUser.uid, {
                    email: googleUser.email || "",
                    displayName: googleUser.displayName || "GymRat User",
                    goals: [],
                    preferences: {
                        units: "metric",
                        theme: "system",
                        notifications: true,
                    },
                });
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Google sign-in failed";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            setError(null);
            await firebaseSignOut();
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Sign out failed";
            setError(message);
        }
    }, []);

    const resetPasswordFn = useCallback(async (email: string) => {
        try {
            setError(null);
            await firebaseResetPassword(email);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Password reset failed";
            setError(message);
            throw err;
        }
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        error,
        signUp,
        signIn,
        signInWithGoogleProvider: signInWithGoogleProvider,
        signOut,
        resetPassword: resetPasswordFn,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
