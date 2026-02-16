import { cn } from "@/lib/utils/cn";
import { HTMLAttributes, forwardRef } from "react";

// ============================================
// Card Component
// ============================================

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "bordered" | "elevated" | "glass";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", children, ...props }, ref) => {
        const variants = {
            default: "bg-card text-card-foreground rounded-xl border border-border",
            bordered: "bg-card text-card-foreground rounded-xl border-2 border-border",
            elevated: "bg-card text-card-foreground rounded-xl shadow-lg",
            glass: "glass rounded-xl",
        };

        return (
            <div
                ref={ref}
                className={cn(variants[variant], "overflow-hidden", className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

// ============================================
// Card Sub-components
// ============================================

const CardHeader = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)}
        {...props}
    />
));

CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
    HTMLHeadingElement,
    HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
));

CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
    HTMLParagraphElement,
    HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));

CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));

CardContent.displayName = "CardContent";

const CardFooter = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-5 pt-0", className)}
        {...props}
    />
));

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
