import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';

export function PrivacyToggle() {
  const store = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isHovered) {
      timeout = setTimeout(() => setIsTooltipVisible(true), 200);
    } else {
      setIsTooltipVisible(false);
    }
    return () => clearTimeout(timeout);
  }, [isHovered]);

  return (
    <div 
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true);
        if (store.setPeeking) {
          store.setPeeking(true);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (store.setPeeking) {
          store.setPeeking(false);
        }
      }}
    >
      <button 
        onClick={() => store.setPrivacyMode(!store.isPrivacyMode)}
        className="btn-secondary !p-2.5"
      >
        {store.isPrivacyMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>

      {isTooltipVisible && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <div className="flex flex-col items-end">
            <div 
              className="flex flex-col gap-0.5 bg-[var(--color-ink)] text-white rounded-xl px-3 py-2 shadow-[var(--shadow-elevated)]"
            >
              <p className="text-sm font-medium">
                {store.isPrivacyMode ? "Privacy Mode On" : "Privacy Mode Off"}
              </p>
              <p className="text-xs text-stone-400">
                CMD+Shift+H
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
