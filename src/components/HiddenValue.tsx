import React from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface HiddenValueProps {
  children: React.ReactNode;
  isHidden: boolean;
  className?: string;
  bulletCount?: number;
  prefix?: string;
}

export function HiddenValue({ children, isHidden, className, bulletCount = 6, prefix = "₹ " }: HiddenValueProps) {
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
            {prefix}{'•'.repeat(bulletCount)}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
