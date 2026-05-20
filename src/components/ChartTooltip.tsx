import React from 'react';

export function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="pointer-events-none bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold text-[var(--color-ink)] mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs font-medium" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
}
