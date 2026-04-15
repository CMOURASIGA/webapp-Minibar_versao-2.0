import React from 'react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const Topbar: React.FC<TopbarProps> = ({ title, subtitle, actions }) => {
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });

  return (
    <div className="sticky top-0 z-40 h-[46px] bg-white border-b border-gray-200 flex items-center justify-between px-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#1B3A5C]">{title}</span>
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-3">
        {actions || <span className="text-xs text-gray-500">{today}</span>}
      </div>
    </div>
  );
};

export default Topbar;
