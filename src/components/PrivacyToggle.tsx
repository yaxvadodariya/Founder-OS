import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function PrivacyToggle() {
  const store = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  // Use a slight delay for tooltip to match typical UX
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
        className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm focus:outline-none transition-all duration-200"
      >
        {store.isPrivacyMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>

      {/* Styled Tooltip - Type=Bottom Left (V1/V2 hybrid) */}
      {isTooltipVisible && (
        <div className="absolute top-[100%] right-0 mt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col items-center">
            {/* Tail */}
            <div 
              className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#21232D]" 
              style={{ alignSelf: 'flex-end', marginRight: '14px' }}
            ></div>
            
            {/* Body */}
            <div 
              className="flex flex-col justify-center gap-1 bg-[#21232D] text-white rounded-[6px] px-3 py-2 w-max"
              style={{
                boxShadow: '0px 12px 24px rgba(134, 140, 152, 0.12), 0px 1px 2px rgba(228, 229, 231, 0.24)'
              }}
            >
              <p className="text-[14px] leading-tight font-medium">
                {store.isPrivacyMode ? "Privacy Mode On" : "Privacy Mode Off"}
              </p>
              <p className="text-[12px] leading-tight text-[#CED0D6]">
                CMD+Shift+H
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
