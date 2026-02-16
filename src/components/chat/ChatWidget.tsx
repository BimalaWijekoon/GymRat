"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Minimize2, Maximize2, Trash2, Brain, BookOpen, Sparkles, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import Button from "@/components/ui/Button";
import { useChat } from "@/contexts/ChatContext";
import type { ChatMode } from "@/lib/api/chat";

// ============================================
// Chat Widget (Floating) — Dual Model
// ============================================

const QUICK_ACTIONS_COACH = [
    { label: "🏋️ Workout Plan", prompt: "Create a 4-day workout plan for muscle gain" },
    { label: "🥗 Nutrition", prompt: "What should I eat to gain muscle?" },
    { label: "💪 Form Check", prompt: "How do I do a proper deadlift?" },
    { label: "🛡️ Safety", prompt: "How to prevent injury during squats?" },
];

const QUICK_ACTIONS_GEMINI = [
    { label: "📋 Meal Plan", prompt: "Create a high-protein meal plan for the week" },
    { label: "🧠 Science", prompt: "Explain the science behind progressive overload" },
    { label: "🏃 Cardio", prompt: "Best cardio for fat loss while maintaining muscle?" },
    { label: "💊 Supplements", prompt: "What supplements are worth taking for building muscle?" },
];

const MODEL_INFO = {
    coach: {
        name: "GymRat Coach",
        icon: BookOpen,
        emoji: "📚",
        gradient: "from-emerald-500 to-teal-600",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200 hover:border-emerald-400",
        badge: "bg-emerald-100 text-emerald-700",
        description: "RAG-powered fitness coach grounded in real fitness literature — workout guides, nutrition textbooks, and exercise science PDFs.",
        features: ["Evidence-based answers", "Cites PDF sources", "Fitness-specific knowledge"],
    },
    gemini: {
        name: "Gemini AI",
        icon: Sparkles,
        emoji: "✨",
        gradient: "from-blue-500 to-violet-600",
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200 hover:border-blue-400",
        badge: "bg-blue-100 text-blue-700",
        description: "Google's Gemini 2.0 Flash — a powerful general-purpose AI model with broad knowledge across all topics.",
        features: ["General knowledge", "Creative responses", "Wider topic range"],
    },
};

export default function ChatWidget() {
    const {
        isOpen,
        toggleChat,
        isMinimized,
        minimizeChat,
        messages,
        sendMessage,
        isLoading,
        clearChat,
        chatMode,
        setChatMode
    } = useChat();

    const [input, setInput] = useState("");
    const [showModelSelector, setShowModelSelector] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isMinimized]);

    // When chat opens and no messages, show model selector
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setShowModelSelector(true);
        }
    }, [isOpen, messages.length]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const text = input;
        setInput("");
        setShowModelSelector(false);
        await sendMessage(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const selectModel = (mode: ChatMode) => {
        setChatMode(mode);
        setShowModelSelector(false);
    };

    const currentModel = MODEL_INFO[chatMode];
    const CurrentIcon = currentModel.icon;

    // Floating button when closed
    if (!isOpen) {
        return (
            <button
                onClick={toggleChat}
                className="fixed bottom-20 right-4 z-50 lg:bottom-6 flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 animate-bounce-in"
                aria-label="Open AI Chat"
            >
                <MessageSquare className="h-6 w-6" />
            </button>
        );
    }

    // Main Chat Window
    return (
        <div
            className={cn(
                "fixed z-50 transition-all duration-300 animate-scale-in shadow-2xl",
                "inset-0 lg:inset-auto",
                "lg:bottom-6 lg:right-6 lg:w-[420px] lg:h-[620px] lg:max-h-[80vh]",
                isMinimized && "lg:h-14 lg:w-[250px] overflow-hidden"
            )}
        >
            <div className="flex h-full flex-col rounded-none lg:rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                {/* Header */}
                <div
                    className={cn(
                        "flex items-center justify-between px-4 py-3 text-white cursor-pointer transition-all",
                        chatMode === "coach" ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-gradient-to-r from-blue-500 to-violet-600"
                    )}
                    onClick={() => isMinimized && minimizeChat(false)}
                >
                    <div className="flex items-center gap-2">
                        <CurrentIcon className="h-5 w-5" />
                        <div>
                            <h3 className="text-sm font-semibold">{currentModel.name}</h3>
                            {!isMinimized && (
                                <p className="text-[10px] text-white/70">
                                    {chatMode === "coach" ? "RAG-Powered Fitness Coach" : "Google Gemini 2.0 Flash"}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {!isMinimized && (
                            <button
                                onClick={() => setShowModelSelector(true)}
                                className="flex h-7 items-center gap-1 rounded-lg px-2 hover:bg-white/20 transition-colors text-xs font-medium"
                                title="Switch model"
                            >
                                Switch
                            </button>
                        )}
                        {!isMinimized && messages.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm("Clear chat history?")) clearChat();
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                                aria-label="Clear chat"
                                title="Clear history"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            onClick={() => minimizeChat()}
                            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                            aria-label={isMinimized ? "Maximize" : "Minimize"}
                        >
                            {isMinimized ? (
                                <Maximize2 className="h-4 w-4" />
                            ) : (
                                <Minimize2 className="h-4 w-4" />
                            )}
                        </button>
                        <button
                            onClick={toggleChat}
                            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                            aria-label="Close chat"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Chat Body */}
                {!isMinimized && (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                            {/* Model Selector Screen */}
                            {showModelSelector ? (
                                <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary mb-3 shadow-lg">
                                        <Brain className="h-7 w-7 text-white" />
                                    </div>
                                    <h3 className="font-bold text-foreground text-base">Choose Your AI</h3>
                                    <p className="mt-1 text-xs text-muted-foreground text-center max-w-xs">
                                        Select which AI model you&apos;d like to chat with
                                    </p>

                                    <div className="mt-4 w-full space-y-3 px-1">
                                        {(["coach", "gemini"] as ChatMode[]).map((mode) => {
                                            const info = MODEL_INFO[mode];
                                            const Icon = info.icon;
                                            const isSelected = chatMode === mode;
                                            return (
                                                <button
                                                    key={mode}
                                                    onClick={() => selectModel(mode)}
                                                    className={cn(
                                                        "w-full text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md",
                                                        isSelected
                                                            ? `${info.border} shadow-md ring-2 ring-offset-1 ${mode === "coach" ? "ring-emerald-300" : "ring-blue-300"}`
                                                            : `border-border hover:${info.border}`
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br", info.gradient)}>
                                                            <Icon className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-foreground text-sm">
                                                                    {info.emoji} {info.name}
                                                                </span>
                                                                {isSelected && (
                                                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", info.badge)}>
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                                {info.description}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {info.features.map((f, i) => (
                                                                    <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                                                        {f}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {messages.length > 0 && (
                                        <button
                                            onClick={() => setShowModelSelector(false)}
                                            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <ArrowLeft className="h-3 w-3" />
                                            Back to chat
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Welcome Message */}
                                    {messages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
                                            <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg mb-3", currentModel.gradient)}>
                                                <CurrentIcon className="h-7 w-7 text-white" />
                                            </div>
                                            <h3 className="font-semibold text-foreground">
                                                {chatMode === "coach"
                                                    ? "Hey! I'm your AI Coach 💪"
                                                    : "Hi! I'm Gemini ✨"
                                                }
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                                                {chatMode === "coach"
                                                    ? "Ask me anything about workouts, nutrition, or exercise form. My answers are backed by fitness research."
                                                    : "Ask me anything! I have broad knowledge across fitness, health, science, and more."
                                                }
                                            </p>

                                            {/* Quick Actions */}
                                            <div className="mt-5 flex flex-wrap gap-2 justify-center">
                                                {(chatMode === "coach" ? QUICK_ACTIONS_COACH : QUICK_ACTIONS_GEMINI).map((action, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => sendMessage(action.prompt)}
                                                        className="rounded-full bg-white border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/5 hover:border-primary/50 transition-colors shadow-sm"
                                                    >
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Messages */}
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex flex-col gap-1 max-w-[85%]",
                                                msg.role === "user" ? "self-end items-end" : "self-start items-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                                                    msg.role === "user"
                                                        ? "gradient-primary text-white rounded-br-none"
                                                        : "bg-white border border-border text-foreground rounded-bl-none"
                                                )}
                                            >
                                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                            </div>

                                            {/* Sources if present */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-1 text-xs bg-muted/50 p-2 rounded-lg border border-border w-full">
                                                    <p className="font-semibold mb-1 text-muted-foreground">📚 Sources:</p>
                                                    <ul className="list-disc pl-4 space-y-0.5">
                                                        {msg.sources.map((source, idx) => (
                                                            <li key={idx}>
                                                                {source.title} {source.page ? `(p. ${source.page})` : ""}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <span className="text-[10px] text-muted-foreground px-1">
                                                {(() => {
                                                    const ts = msg.timestamp as any;
                                                    const date = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
                                                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                })()}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Loading */}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                                <div className="flex gap-1.5">
                                                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                                                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                                                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        {!showModelSelector && (
                            <div className="border-t border-border p-3 bg-card">
                                {/* Active model indicator */}
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className={cn("h-2 w-2 rounded-full bg-gradient-to-r", currentModel.gradient)} />
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                        {currentModel.name}
                                    </span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={chatMode === "coach" ? "Ask your AI coach..." : "Ask Gemini anything..."}
                                        rows={1}
                                        className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 max-h-24 scrollbar-hide"
                                        disabled={isLoading}
                                        style={{ minHeight: "44px" }}
                                    />
                                    <Button
                                        size="icon"
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className={cn(
                                            "h-11 w-11 rounded-xl flex-shrink-0 shadow-md hover:shadow-lg transition-all",
                                            chatMode === "coach" ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" : "bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700"
                                        )}
                                    >
                                        <Send className="h-5 w-5 text-white" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
