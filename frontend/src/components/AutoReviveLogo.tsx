import React from 'react';
import { AUTOREVIVE_LOGO_BASE64 } from '../assets/logoBase64';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showSubText?: boolean;
  tagline?: string;
}

export const AutoReviveLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'lg',
}) => {
  const heightMap: Record<string, string> = {
    sm:   '36px',
    md:   '48px',
    lg:   '60px',
    xl:   '72px',
    hero: '86px',
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={AUTOREVIVE_LOGO_BASE64}
        alt="AutoRevive"
        style={{
          height: heightMap[size] || '48px',
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
        draggable={false}
      />
    </div>
  );
};

