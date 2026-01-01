import { twMerge } from 'tailwind-merge';

interface RiskBadgeProps {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
    const colors = {
        LOW: 'bg-green-500/20 text-green-200 border-green-500/50',
        MEDIUM: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/50',
        HIGH: 'bg-red-500/20 text-red-200 border-red-500/50 animate-pulse',
    };

    return (
        <span
            className={twMerge(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border',
                colors[level],
                className
            )}
        >
            {level}
        </span>
    );
}
