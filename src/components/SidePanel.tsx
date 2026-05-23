import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Width class — defaults to max-w-lg */
  width?: string;
}

export function SidePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-lg',
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'side-panel-backdrop',
          isOpen ? 'side-panel-backdrop-open' : 'side-panel-backdrop-closed'
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'side-panel',
          width,
          isOpen ? 'side-panel-open' : 'side-panel-closed'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="side-panel-header">
          <div className="flex-1 min-w-0">
            <h2 className="side-panel-title">{title}</h2>
            {subtitle && <p className="side-panel-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="side-panel-close"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="side-panel-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="side-panel-footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
