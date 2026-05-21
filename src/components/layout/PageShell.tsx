import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

/** Consistent mobile-first page wrapper — prevents horizontal overflow */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('mobile-page page-shell', className)}>
      {children}
    </div>
  );
}
