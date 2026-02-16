"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { sendChatMessage, ChatMode } from "@/lib/api/chat";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ChatMessage, ChatConversation } from "@/types/firestore";
import { toast } from "sonner";

interface ChatContextType {
    isOpen: boolean;
    isMinimized: boolean;
    messages: ChatMessage[];
    isLoading: boolean;
    chatMode: ChatMode;
    setChatMode: (mode: ChatMode) => void;
    toggleChat: () => void;
    minimizeChat: (minimized?: boolean) => void;
    sendMessage: (content: string) => Promise<void>;
    clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [chatMode, setChatMode] = useState<ChatMode>("coach");

    // Initialize or load conversation when user logs in
    useEffect(() => {
        if (!user) {
            setMessages([]);
            setConversationId(null);
            return;
        }

        const loadConversation = async () => {
            const chatId = `chat_${user.uid}`;
            setConversationId(chatId);

            try {
                const chatRef = doc(db, "chats", chatId);
                const chatSnap = await getDoc(chatRef);

                if (chatSnap.exists()) {
                    const data = chatSnap.data() as ChatConversation;
                    setMessages(data.messages || []);
                } else {
                    await setDoc(chatRef, {
                        id: chatId,
                        userId: user.uid,
                        messages: [],
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                }
            } catch (error) {
                console.error("Error loading chat:", error);
                toast.error("Failed to load chat history");
            }
        };

        loadConversation();
    }, [user]);

    const toggleChat = () => setIsOpen(prev => !prev);

    const minimizeChat = (minimized?: boolean) => {
        setIsMinimized(prev => minimized ?? !prev);
    };

    const sendMessage = async (content: string) => {
        if (!user || !conversationId || !content.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: content.trim(),
            timestamp: Timestamp.now(),
        };

        // Optimistic update
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // Save user message to Firestore
            const chatRef = doc(db, "chats", conversationId);
            await updateDoc(chatRef, {
                messages: arrayUnion(userMsg),
                updatedAt: serverTimestamp(),
            });

            // Call API with selected mode
            const response = await sendChatMessage(content, user.uid, chatMode);

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: response.response,
                sources: response.sources.map(s => ({
                    title: s.title,
                    snippet: s.snippet,
                    page: s.page
                })),
                timestamp: Timestamp.now(),
            };

            // Save AI message to Firestore
            await updateDoc(chatRef, {
                messages: arrayUnion(aiMsg),
                updatedAt: serverTimestamp(),
            });

            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error("Chat error:", error);
            toast.error("Failed to make request. Is the backend running?");

            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                role: "assistant",
                content: "Sorry, I'm having trouble connecting right now. Please check if the backend is running! 🧠🔌",
                timestamp: Timestamp.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = async () => {
        if (!conversationId) return;
        setMessages([]);
        try {
            const chatRef = doc(db, "chats", conversationId);
            await updateDoc(chatRef, {
                messages: []
            });
        } catch (error) {
            console.error("Error clearing chat:", error);
        }
    };

    return (
        <ChatContext.Provider value={{
            isOpen,
            isMinimized,
            messages,
            isLoading,
            chatMode,
            setChatMode,
            toggleChat,
            minimizeChat,
            sendMessage,
            clearChat
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
