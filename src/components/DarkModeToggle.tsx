import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

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
        className="inline-flex items-center justify-center p-3 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-md focus:outline-none transition-all duration-200"
      >
        {store.isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Styled Tooltip - Type=Bottom Left (V1/V2 hybrid) adapted for bottom right floating */}
      {isTooltipVisible && (
        <div className="absolute bottom-[100%] right-0 mb-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col items-center">
            {/* Body */}
            <div 
              className="flex flex-col justify-center gap-1 bg-[#21232D] text-white rounded-[6px] px-3 py-2 w-max"
              style={{
                boxShadow: '0px 12px 24px rgba(134, 140, 152, 0.12), 0px 1px 2px rgba(228, 229, 231, 0.24)'
              }}
            >
              <p className="text-[14px] leading-tight font-medium">
                {store.isDarkMode ? "Light Mode" : "Dark Mode"}
              </p>
            </div>
            {/* Tail pointing down */}
            <div 
              className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#21232D]" 
              style={{ alignSelf: 'flex-end', marginRight: '14px' }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
