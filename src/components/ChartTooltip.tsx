import React from 'react';
import { formatCurrency } from '../lib/utils';

const LABEL_MAP: Record<string, string> = {
  income: 'Income',
  expense: 'Expenses',
  incomePrev: 'Previous Income',
  expensePrev: 'Previous Expenses',
};

export function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="pointer-events-none bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-3.5 py-2.5 shadow-[var(--shadow-elevated)]">
        <p className="text-xs font-semibold text-[var(--color-ink)] mb-1.5">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs py-0.5">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[var(--color-ink-secondary)]">
              {LABEL_MAP[entry.dataKey] || entry.name}
            </span>
            <span className="font-semibold text-[var(--color-ink)] ml-auto tabular-nums">
              {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
