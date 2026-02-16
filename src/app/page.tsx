"use client";

import Link from "next/link";
import { Dumbbell, TrendingUp, Brain, Shield, Zap, BarChart3 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// ============================================
// Landing Page
// ============================================

const FEATURES = [
  {
    icon: Dumbbell,
    title: "Smart Workout Logging",
    description: "Log exercises, track sets/reps/weight, and see your history at a glance.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Visualize your gains with interactive charts and automatic PR detection.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Brain,
    title: "AI Fitness Coach",
    description: "Get personalized workout plans and nutrition advice from your AI coach.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Shield,
    title: "Evidence-Based",
    description: "Advice powered by fitness research, sports science, and nutrition literature.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Zap,
    title: "Progressive Overload",
    description: "Smart suggestions to help you progressively increase your training load.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: BarChart3,
    title: "Personal Records",
    description: "Automatically detect and celebrate new PRs with milestone tracking.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              GymRat <span className="text-primary">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </nav>

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <div className="animate-slide-up">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              🏋️ AI-Powered Fitness Coaching
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your Personal{" "}
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                AI Fitness Coach
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Log workouts, track progress, and get personalized coaching — all
              powered by advanced AI. GymRat AI helps you train smarter and
              achieve your fitness goals faster.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup">
                <Button size="lg" className="px-8 shadow-lg shadow-primary/25">
                  Start Free
                  <Zap className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Everything you need to
            <br />
            <span className="text-primary">crush your fitness goals</span>
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="group rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl gradient-hero p-10 text-white shadow-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to transform your training?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80 text-lg">
            Join GymRat AI today and let your AI coach help you build the
            perfect workout routine.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="mt-8 bg-white text-primary hover:bg-white/90 shadow-lg px-8"
            >
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            © 2026 GymRat AI. All rights reserved. Built with ❤️ for fitness enthusiasts.
          </p>
        </div>
      </footer>
    </div>
  );
}
