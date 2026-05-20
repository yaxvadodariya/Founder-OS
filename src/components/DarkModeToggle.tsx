import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';

export function DarkModeToggle() {
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button 
        onClick={() => store.toggleDarkMode()}
        className="btn-secondary !p-3 !rounded-full shadow-[var(--shadow-card)]"
      >
        {store.isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {isTooltipVisible && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <div className="bg-[var(--color-ink)] text-white rounded-xl px-3 py-2 text-sm font-medium shadow-[var(--shadow-elevated)]">
            {store.isDarkMode ? "Light Mode" : "Dark Mode"}
          </div>
        </div>
      )}
    </div>
  );
}
