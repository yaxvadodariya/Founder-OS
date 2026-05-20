import React from 'react';
import { cn, CURRENCIES } from '../lib/utils';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

interface HiddenValueProps {
  children: React.ReactNode;
  isHidden: boolean;
  className?: string;
  bulletCount?: number;
  prefix?: string;
}

export function HiddenValue({ children, isHidden, className, bulletCount = 6, prefix }: HiddenValueProps) {
  const currencyCode = useStore((state) => state.currency) || 'USD';
  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';
  const finalPrefix = prefix !== undefined ? prefix : `${currencySymbol} `;

  return (
    <span className={cn("relative inline-block overflow-hidden", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {!isHidden ? (
          <motion.span
            key="visible"
            initial={{ opacity: 0, filter: 'blur(4px)', y: 4 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(4px)', y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="inline-block"
          >
            {children}
          </motion.span>
        ) : (
          <motion.span
            key="hidden"
            initial={{ opacity: 0, filter: 'blur(4px)', y: 4 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(4px)', y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="inline-flex items-center tracking-widest text-[#B3B3B3]"
          >
            {finalPrefix}{'•'.repeat(bulletCount)}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
