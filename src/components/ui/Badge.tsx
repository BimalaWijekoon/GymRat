import { cn } from "@/lib/utils/cn";

// ============================================
// Badge Component
// ============================================

interface BadgeProps {
    variant?: "default" | "success" | "warning" | "destructive" | "outline";
    size?: "sm" | "md";
    children: React.ReactNode;
    className?: string;
}

export default function Badge({
    variant = "default",
    size = "md",
    children,
    className,
}: BadgeProps) {
    const variants = {
        default: "bg-primary/10 text-primary border-primary/20",
        success: "bg-success/10 text-success border-success/20",
        warning: "bg-warning/10 text-warning border-warning/20",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
        outline: "bg-transparent text-foreground border-border",
    };

    const sizes = {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border font-medium transition-colors",
                variants[variant],
                sizes[size],
                className
            )}
        >
            {children}
        </span>
    );
}
