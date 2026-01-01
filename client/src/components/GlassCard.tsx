import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function GlassCard({ children, className, onClick }: GlassCardProps) {
    return (
        <div
            className={twMerge(
                'glass rounded-xl p-6 transition-all duration-300',
                onClick && 'cursor-pointer hover:bg-white/20',
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
