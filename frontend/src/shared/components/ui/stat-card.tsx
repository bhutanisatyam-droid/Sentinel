'use client';
import { cn } from '@/shared/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg bg-[#0A0A0A] border border-[#161616]',
        className,
      )}
    >
      <span className="text-[10px] text-[#555] uppercase tracking-[0.08em]">
        {label}
      </span>
      <div className="text-xl font-semibold text-[#e0e0e0] font-mono mt-1">
        {value}
      </div>
      {change && (
        <span
          className={cn('text-[10px] mt-1 inline-block', {
            'text-[#10b981]': changeType === 'positive',
            'text-[#ef4444]': changeType === 'negative',
            'text-[#555]':    changeType === 'neutral',
          })}
        >
          {change}
        </span>
      )}
    </div>
  );
}

