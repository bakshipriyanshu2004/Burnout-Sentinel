
import { cn } from "@/lib/utils";

interface DashboardCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

export function DashboardCard({ children, className, title, action }: DashboardCardProps) {
    return (
        <div className={cn("rounded-xl bg-[#0F131E]/80 backdrop-blur-sm border border-white/5 p-6 shadow-xl transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:bg-[#0F131E]/90", className)}>
            {(title || action) && (
                <div className="flex justify-between items-center mb-6">
                    {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
