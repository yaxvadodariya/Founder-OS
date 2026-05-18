import React from 'react';

export function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div 
        className="flex flex-col relative animate-in fade-in zoom-in-95 duration-150 items-center pointer-events-none"
        style={{
          filter: 'drop-shadow(0px 12px 24px rgba(134, 140, 152, 0.12)) drop-shadow(0px 1px 2px rgba(228, 229, 231, 0.24))',
        }}
      >
        {/* Tooltip Body */}
        <div className="flex flex-row items-center justify-center px-[10px] py-[4px] gap-[6px] bg-[#21232D] rounded-[6px] min-w-[106px] min-h-[28px] z-10 relative">
            <div className="flex flex-col mb-1 text-center">
              <p className="text-[#FFFFFF] text-[14px] font-medium leading-[20px] tracking-[-0.006em]">
                {label}
              </p>
              {payload.map((entry: any, index: number) => (
                <p key={index} className="text-[12px] font-medium leading-[16px] text-center mt-1" style={{ color: entry.color }}>
                  {entry.name}: {entry.value.toLocaleString()}
                </p>
              ))}
            </div>
        </div>
        
        {/* Tail - V2 Style Triangle pointing down */}
        <div className="w-full flex justify-center mt-[-1px] z-0">
          <div 
            className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#21232D]"
          ></div>
        </div>
      </div>
    );
  }

  return null;
}
