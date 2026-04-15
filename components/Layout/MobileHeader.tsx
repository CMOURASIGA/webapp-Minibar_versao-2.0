import React from 'react';
import { LOGO_URL } from '../../constants';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  rightAction,
  showBack,
  onBack
}) => {
  return (
    <div className="bg-[#1B3A5C] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-white/10 text-white text-sm flex items-center justify-center"
            aria-label="Voltar"
          >
            {'<'}
          </button>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center">
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-white">{title}</div>
          {subtitle && <div className="text-[10px] text-white/60">{subtitle}</div>}
        </div>
      </div>
      {rightAction && <div className="text-white">{rightAction}</div>}
    </div>
  );
};

export default MobileHeader;
