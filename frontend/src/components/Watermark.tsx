import React from 'react';

interface WatermarkProps {
  opacity?: number;
  text?: string;
}

/**
 * Diagonal continuous multi-line repeating watermark in AutoRevive brand logo orange color (#EA580C)
 */
export const Watermark: React.FC<WatermarkProps> = ({ 
  opacity = 0.065,
  text = 'AUTOREVIVE' 
}) => {
  // Generate diagonal repeating rows across the whole A4 sheet
  const rows = [-250, -150, -50, 50, 150, 250, 350, 450, 550, 650, 750, 850, 950, 1050, 1150];
  const repeatText = `${text}   •   ${text}   •   ${text}   •   ${text}   •   ${text}`;

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div 
        className="w-[190%] h-[190%] -translate-x-[45%] -translate-y-[45%] transform -rotate-[32deg] flex flex-col justify-around pointer-events-none select-none"
        style={{ opacity }}
      >
        {rows.map((_, idx) => (
          <div 
            key={idx}
            className="whitespace-nowrap font-sans font-black text-[#EA580C] text-[18px] tracking-[0.35em] uppercase select-none leading-none"
            style={{ 
              marginLeft: idx % 2 === 0 ? '-80px' : '40px',
              marginRight: '-200px',
              padding: '20px 0'
            }}
          >
            {repeatText}
          </div>
        ))}
      </div>
    </div>
  );
};
