import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'header' | 'sidebar' | 'login';
  showKoelBadge?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'header',
  showKoelBadge = false,
}) => {
  const imgHeights = {
    sm: 'h-7',
    md: 'h-8',
    lg: 'h-11',
  };

  const shouldShowKoelBadge = showKoelBadge;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Green Kirloskar Brand Logo */}
      <div className="bg-white px-2 py-1 rounded-lg border border-emerald-300/80 shadow-xs flex items-center justify-center shrink-0 ring-1 ring-emerald-500/10">
        <img
          src="/assets/aistudio/logo_c9eeabd6.jpg"
          alt="Kirloskar Brand Logo"
          className={`${imgHeights[size]} w-auto object-contain`}
          loading="eager"
        />
      </div>

      {/* Teal-Green KOEL Logo / Badge labeled explicitly 'KOEL' and 'MARINE' */}
      {shouldShowKoelBadge && (
        <div className="flex items-center rounded-lg overflow-hidden border border-emerald-700/30 shadow-xs shrink-0">
          <span className="bg-[#064e3b] text-white font-extrabold text-xs px-2.5 py-1 tracking-wider uppercase flex items-center">
            KOEL
          </span>
          <span className="bg-[#0d9488] text-white font-bold text-[10px] px-2 py-1 tracking-widest uppercase">
            MARINE
          </span>
        </div>
      )}
    </div>
  );
};

