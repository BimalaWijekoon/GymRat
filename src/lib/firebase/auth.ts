import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    updateProfile,
    User,
    NextOrObserver,
} from "firebase/auth";
import { auth } from "./config";

// ============================================
// Authentication Service
// ============================================

const googleProvider = new GoogleAuthProvider();

/**
 * Sign up with email and password.
 * Also sets the display name on the Firebase Auth user.
 */
export async function signUpWithEmail(
    email: string,
    password: string,
    displayName?: string
): Promise<User> {
    try {
        const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        if (displayName) {
            await updateProfile(credential.user, { displayName });
        }
        return credential.user;
    } catch (error: unknown) {
        throw formatAuthError(error);
    }
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(
    email: string,
    password: string
): Promise<User> {
    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return credential.user;
    } catch (error: unknown) {
        throw formatAuthError(error);
    }
}

/**
 * Sign in with Google popup.
 */
export async function signInWithGoogle(): Promise<User> {
    try {
        const credential = await signInWithPopup(auth, googleProvider);
        return credential.user;
    } catch (error: unknown) {
        throw formatAuthError(error);
    }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
    try {
        await firebaseSignOut(auth);
    } catch (error: unknown) {
        throw formatAuthError(error);
    }
}

/**
 * Send password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
        throw formatAuthError(error);
    }
}

/**
 * Get the currently signed-in user (or null).
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChanged(callback: NextOrObserver<User | null>) {
    return firebaseOnAuthStateChanged(auth, callback);
}

// ============================================
// Error Formatting
// ============================================

interface FirebaseError {
    code?: string;
    message?: string;
}

function formatAuthError(error: unknown): Error {
    const firebaseError = error as FirebaseError;
    const code = firebaseError.code || "";

    const errorMessages: Record<string, string> = {
        "auth/email-already-in-use": "This email is already registered. Try signing in instead.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/operation-not-allowed": "This sign-in method is not enabled.",
        "auth/weak-password": "Password must be at least 6 characters long.",
        "auth/user-disabled": "This account has been disabled. Contact support.",
        "auth/user-not-found": "No account found with this email. Try signing up.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-credential": "Invalid credentials. Please check your email and password.",
        "auth/too-many-requests": "Too many failed attempts. Please try again later.",
        "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
        "auth/network-request-failed": "Network error. Please check your connection.",
    };

    const message =
        errorMessages[code] ||
        firebaseError.message ||
        "An unexpected error occurred. Please try again.";

    return new Error(message);
}
