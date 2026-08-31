import React from 'react';

interface StampProps {
  className?: string;
  size?: number;
}

export const AutoReviveStamp: React.FC<StampProps> = ({ className = '', size = 120 }) => {
  return (
    <div 
      className={`relative select-none pointer-events-none inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg 
        viewBox="0 0 300 300" 
        className="w-full h-full transform -rotate-[6deg] drop-shadow-sm select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top text path for AUTOREVIVE */}
          <path
            id="seal-top-path"
            d="M 45,150 A 105,105 0 1,1 255,150"
            fill="none"
          />
          {/* Bottom text path for REPO AUCTION */}
          <path
            id="seal-bottom-path"
            d="M 255,150 A 105,105 0 0,1 45,150"
            fill="none"
          />
        </defs>

        {/* Outer Circular Grunge Ring (Orange #EA580C) */}
        <circle 
          cx="150" 
          cy="150" 
          r="142" 
          fill="#FFFDFB" 
          stroke="#EA580C" 
          strokeWidth="6.5" 
          strokeDasharray="45 2 25 1 35 3 20 2"
        />
        <circle 
          cx="150" 
          cy="150" 
          r="136" 
          fill="none" 
          stroke="#EA580C" 
          strokeWidth="2.5" 
        />

        {/* Outer Circular Text Top: AUTOREVIVE (Black #0F172A) */}
        <text 
          fill="#0F172A" 
          style={{ 
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '28px', 
            fontWeight: 900, 
            letterSpacing: '0.28em' 
          }}
        >
          <textPath 
            href="#seal-top-path" 
            startOffset="50%" 
            textAnchor="middle"
          >
            AUTOREVIVE
          </textPath>
        </text>

        {/* Outer Circular Text Bottom: REPO AUCTION (Black #0F172A) */}
        <text 
          fill="#0F172A" 
          style={{ 
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '25px', 
            fontWeight: 900, 
            letterSpacing: '0.26em' 
          }}
        >
          <textPath 
            href="#seal-bottom-path" 
            startOffset="50%" 
            textAnchor="middle"
          >
            REPO AUCTION
          </textPath>
        </text>

        {/* Left Icon: Cogwheel / Gear in Orange */}
        <g transform="translate(38, 140) scale(0.75)" fill="#EA580C">
          <path d="M11 0 L13 0 L13.5 3.5 C14.5 3.8 15.5 4.3 16.4 5 L19.5 3.2 L21 4.7 L19.2 7.8 C19.9 8.7 20.4 9.7 20.7 10.7 L24.2 11.2 L24.2 13.2 L20.7 13.7 C20.4 14.7 19.9 15.7 19.2 16.6 L21 19.7 L19.5 21.2 L16.4 19.4 C15.5 20.1 14.5 20.6 13.5 20.9 L13 24.4 L11 24.4 L10.5 20.9 C9.5 20.6 8.5 20.1 7.6 19.4 L4.5 21.2 L3 19.7 L4.8 16.6 C4.1 15.7 3.6 14.7 3.3 13.7 L-0.2 13.2 L-0.2 11.2 L3.3 10.7 C3.6 9.7 4.1 8.7 4.8 7.8 L3 4.7 L4.5 3.2 L7.6 5 C8.5 4.3 9.5 3.8 10.5 3.5 Z" />
          <circle cx="12" cy="12.2" r="4.5" fill="#ffffff" stroke="#EA580C" strokeWidth="2.5" />
        </g>

        {/* Right Icon: Gavel in Orange */}
        <g transform="translate(242, 138) scale(0.75)" fill="#EA580C">
          {/* Mallet head */}
          <rect x="0" y="4" width="18" height="9" rx="1.5" transform="rotate(-35 9 8.5)" fill="#EA580C" />
          {/* Handle */}
          <rect x="6.5" y="10" width="4.5" height="15" rx="1" transform="rotate(-35 9 8.5)" fill="#EA580C" />
          {/* Strike Plate */}
          <rect x="1" y="20" width="18" height="3" rx="1" fill="#EA580C" />
        </g>

        {/* Dual Inner Orange Concentric Rings */}
        <circle 
          cx="150" 
          cy="150" 
          r="86" 
          fill="none" 
          stroke="#EA580C" 
          strokeWidth="4" 
        />
        <circle 
          cx="150" 
          cy="150" 
          r="80" 
          fill="none" 
          stroke="#EA580C" 
          strokeWidth="2" 
        />

        {/* Center: Car Silhouette + Crown + Aut[gear]Revive + Gavel */}
        <g transform="translate(150, 150) scale(0.68)">
          {/* Car Silhouette top roofline */}
          <path
            d="M -75, -5 C -45, -35, 10, -35, 45, -15 C 65, -5, 75, 5, 85, 8"
            fill="none"
            stroke="#EA580C"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M -50, -18 C -20, -30, 20, -30, 48, -12"
            fill="none"
            stroke="#EA580C"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Crown on top-left of 'Au' */}
          <path
            d="M -88, -20 L -80, -6 L -68, -24 L -56, -6 L -48, -20 L -45, 0 L -91, 0 Z"
            fill="#EA580C"
          />

          {/* Central Logo Typography: Aut[gear]Revive */}
          <g transform="translate(0, 14)">
            {/* "Aut" */}
            <text
              x="-82"
              y="0"
              fill="#EA580C"
              style={{
                fontFamily: 'serif',
                fontSize: '32px',
                fontWeight: 900,
                letterSpacing: '-0.5px',
              }}
            >
              Aut
            </text>

            {/* Gear 'o' */}
            <g transform="translate(-32, -12) scale(0.78)" fill="#EA580C">
              <path d="M11 0 L13 0 L13.5 3.5 C14.5 3.8 15.5 4.3 16.4 5 L19.5 3.2 L21 4.7 L19.2 7.8 C19.9 8.7 20.4 9.7 20.7 10.7 L24.2 11.2 L24.2 13.2 L20.7 13.7 C20.4 14.7 19.9 15.7 19.2 16.6 L21 19.7 L19.5 21.2 L16.4 19.4 C15.5 20.1 14.5 20.6 13.5 20.9 L13 24.4 L11 24.4 L10.5 20.9 C9.5 20.6 8.5 20.1 7.6 19.4 L4.5 21.2 L3 19.7 L4.8 16.6 C4.1 15.7 3.6 14.7 3.3 13.7 L-0.2 13.2 L-0.2 11.2 L3.3 10.7 C3.6 9.7 4.1 8.7 4.8 7.8 L3 4.7 L4.5 3.2 L7.6 5 C8.5 4.3 9.5 3.8 10.5 3.5 Z" />
              <circle cx="12" cy="12.2" r="4.5" fill="#ffffff" stroke="#EA580C" strokeWidth="2.5" />
            </g>

            {/* "Revive" */}
            <text
              x="-8"
              y="0"
              fill="#EA580C"
              style={{
                fontFamily: 'serif',
                fontSize: '32px',
                fontWeight: 900,
                letterSpacing: '-0.5px',
              }}
            >
              Revive
            </text>

            {/* Gavel next to Revive */}
            <g transform="translate(68, -16) scale(0.75)" fill="#EA580C">
              <rect x="0" y="4" width="18" height="9" rx="1.5" transform="rotate(-35 9 8.5)" fill="#EA580C" />
              <rect x="6.5" y="10" width="4.5" height="15" rx="1" transform="rotate(-35 9 8.5)" fill="#EA580C" />
              <rect x="0" y="21" width="20" height="3" rx="1" fill="#EA580C" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};
