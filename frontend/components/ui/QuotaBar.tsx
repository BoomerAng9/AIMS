import React from 'react';
import { motion } from 'framer-motion';

interface QuotaBarProps {
    used: number;
    total: number;
    label?: string;
    showDetails?: boolean;
}

export const QuotaBar: React.FC<QuotaBarProps> = ({ used, total, label = 'Overall usage this cycle', showDetails = true }) => {
    const percentage = total > 0 ? Math.min(100, (used / total) * 100) : 0;

    let colorClass = 'bg-[#10B981]'; // Emerald (Healthy)
    let shadowClass = 'shadow-[#10B981]/20';
    let textClass = 'text-[#10B981]';

    if (percentage >= 95) {
        colorClass = 'bg-[#EF4444]'; // Red (Critical)
        shadowClass = 'shadow-[#EF4444]/20';
        textClass = 'text-[#EF4444]';
    } else if (percentage >= 80) {
        colorClass = 'bg-[#F59E0B]'; // Amber (Warning)
        shadowClass = 'shadow-[#F59E0B]/20';
        textClass = 'text-[#F59E0B]';
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-zinc-400">{label}</span>
                {showDetails && (
                    <span className={`text-sm font-mono font-bold ${textClass}`}>
                        {percentage.toFixed(1)}%
                    </span>
                )}
            </div>
            <div className="h-3 w-full bg-[#18181B] rounded-full overflow-hidden border border-white/[0.04]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${colorClass} ${shadowClass} shadow-lg relative`}
                >
                    {percentage >= 95 && (
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 bg-white/20"
                        />
                    )}
                </motion.div>
            </div>
            {showDetails && (
                <div className="flex justify-between mt-2 text-xs text-zinc-500">
                    <span>{used.toLocaleString()} used</span>
                    <span>{total.toLocaleString()} limit</span>
                </div>
            )}
        </div>
    );
};
