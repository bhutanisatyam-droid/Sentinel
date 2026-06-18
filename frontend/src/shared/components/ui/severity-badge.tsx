'use client';
import { cn } from '@/shared/lib/utils';

interface SeverityBadgeProps {
  variant: 'critical' | 'high' | 'medium' | 'low' | 'default';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const dotColors: Record<SeverityBadgeProps['variant'], string> = {
  critical: 'bg-[#ef4444]',
  high:     'bg-[#f59e0b]',
  medium:   'bg-[#3b82f6]',
  low:      'bg-[#10b981]',
  default:  'bg-[#444]',
};

const textColors: Record<SeverityBadgeProps['variant'], string> = {
  critical: 'text-[#ef4444]',
  high:     'text-[#f59e0b]',
  medium:   'text-[#3b82f6]',
  low:      'text-[#10b981]',
  default:  'text-[#666]',
};

export function SeverityBadge({ variant = 'default', children, className, dot }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium',
        textColors[variant],
        className,
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

