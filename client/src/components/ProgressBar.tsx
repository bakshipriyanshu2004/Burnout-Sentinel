
import { cn } from "@/lib/utils";

interface ProgressBarProps {
    value: number; // 0-100
    max?: number;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
}

export function ProgressBar({ value, max = 100, variant = 'default', className }: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    let colorClass = "bg-blue-500";
    if (variant === 'success') colorClass = "bg-emerald-500";
    if (variant === 'warning') colorClass = "bg-amber-500";
    if (variant === 'danger') colorClass = "bg-red-500";

    return (
        <div className={cn("h-2 w-full bg-slate-700/50 rounded-full overflow-hidden", className)}>
            <div
                className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}
