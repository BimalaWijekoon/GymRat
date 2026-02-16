"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Dumbbell,
    TrendingUp,
    User,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

// ============================================
// Navigation Items
// ============================================

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/workouts", label: "Workouts", icon: Dumbbell },
    { href: "/dashboard/progress", label: "Progress", icon: TrendingUp },
    { href: "/dashboard/profile", label: "Profile", icon: User },
];

// ============================================
// Navigation Component
// ============================================

export default function Navigation() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-lg px-6">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                        <Dumbbell className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-foreground">
                        GymRat <span className="text-primary">AI</span>
                    </span>
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                    isActive(item.href)
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <span className="text-sm font-medium text-foreground hidden xl:block">
                            {user?.displayName || "User"}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={signOut}
                        aria-label="Sign out"
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </nav>

            {/* Mobile Top Bar */}
            <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-lg px-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                        <Dumbbell className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-foreground">
                        GymRat <span className="text-primary">AI</span>
                    </span>
                </Link>

                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </button>
            </nav>

            {/* Mobile Drawer */}
            {isMobileMenuOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 z-40 bg-black/50"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="lg:hidden fixed top-14 right-0 z-50 w-64 h-[calc(100vh-3.5rem)] border-l border-border bg-card p-4 animate-slide-down shadow-xl">
                        <div className="flex flex-col gap-1">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                            isActive(item.href)
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="mt-auto pt-4 border-t border-border mt-4">
                            <div className="flex items-center gap-3 px-3 py-2 mb-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                    {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {user?.displayName || "User"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    signOut();
                                }}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-lg px-2 py-1 safe-area-bottom">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all",
                                isActive(item.href)
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive(item.href) && "scale-110")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
