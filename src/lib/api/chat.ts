/**
 * GymRat AI — RAG API Client
 * Communicates with the FastAPI backend for AI chat responses.
 */

export type ChatMode = "coach" | "gemini";

interface ChatResponse {
    response: string;
    sources: {
        title: string;
        page?: number;
        snippet: string;
        category: string;
    }[];
    timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Send a chat message to the AI backend.
 * @param mode - "coach" for RAG-powered fitness coach, "gemini" for direct Gemini AI
 */
export async function sendChatMessage(
    query: string,
    userId: string,
    mode: ChatMode = "coach",
    context?: string
): Promise<ChatResponse> {
    const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query,
            user_id: userId,
            mode,
            context,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Check if the backend API is healthy.
 */
export async function checkApiHealth(): Promise<{
    status: string;
    version: string;
    document_count: number;
}> {
    const response = await fetch(`${API_URL}/api/health`);

    if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
    }

    return response.json();
}
