import { cn } from "@/lib/utils/cn";
import { InputHTMLAttributes, forwardRef } from "react";

// ============================================
// Input Component
// ============================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, id, type = "text", ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-foreground"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    type={type}
                    className={cn(
                        "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm",
                        "placeholder:text-muted-foreground",
                        "transition-colors duration-200",
                        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        className
                    )}
                    aria-invalid={!!error}
                    aria-describedby={
                        error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
                    }
                    {...props}
                />
                {error && (
                    <p id={`${inputId}-error`} className="text-xs text-destructive" role="alert">
                        {error}
                    </p>
                )}
                {!error && helperText && (
                    <p id={`${inputId}-helper`} className="text-xs text-muted-foreground">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
