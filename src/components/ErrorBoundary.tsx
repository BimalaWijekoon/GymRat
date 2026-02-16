"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import Button from "@/components/ui/Button";

// ============================================
// Error Boundary
// ============================================

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
                        <AlertTriangle className="h-7 w-7 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-6">
                        {this.state.error?.message ||
                            "An unexpected error occurred. Please try again."}
                    </p>
                    <div className="flex gap-3">
                        <Button onClick={this.handleReset} variant="outline">
                            <RefreshCcw className="h-4 w-4" />
                            Try Again
                        </Button>
                        <Button onClick={() => window.location.reload()}>
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
