'use client';

import { Card } from '@/components/ui/card';
import { ListTodo, Zap, Loader2, CheckCircle } from 'lucide-react';
import { THEME_COLOR } from './constants';

export interface IntentsStatsProps {
  total: number;
  active: number;
  pending: number;
  executed: number;
}

export function IntentsStats({ total, active, pending, executed }: IntentsStatsProps) {
  const items: Array<{ value: number; label: string; Icon: typeof ListTodo; iconBg: string; iconStyle?: React.CSSProperties }> = [
    { value: total, label: 'Total', Icon: ListTodo, iconBg: 'bg-[#1e40af]/10', iconStyle: { color: THEME_COLOR } },
    { value: active, label: 'Active', Icon: Zap, iconBg: 'bg-emerald-500/10' },
    { value: pending, label: 'Pending', Icon: Loader2, iconBg: 'bg-amber-500/10' },
    { value: executed, label: 'Done', Icon: CheckCircle, iconBg: 'bg-blue-500/10' },
  ];
  const iconColors = ['', 'text-emerald-600', 'text-amber-600', 'text-blue-600'];
  return (
    <div className="flex flex-col gap-2">
      {items.map(({ value, label, Icon, iconBg, iconStyle }, idx) => (
        <Card
          key={label}
          className="p-3 border-[#1e40af]/15 bg-card/80 rounded-lg flex flex-row items-center gap-3"
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColors[idx]}`} style={iconStyle} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
