import ProtectedRoute from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import { ChatProvider } from "@/contexts/ChatContext";
import ChatWidget from "@/components/chat/ChatWidget";

// ============================================
// Dashboard Layout
// ============================================

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <ChatProvider>
                <div className="min-h-screen bg-background">
                    <Navigation />

                    {/* Main Content */}
                    <main className="pt-14 pb-16 lg:pt-16 lg:pb-0">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>

                    {/* Chat Widget */}
                    <ChatWidget />
                </div>
            </ChatProvider>
        </ProtectedRoute>
    );
}
