
import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, subtitle, children, className = '' }) => {
  return (
    <div className={`bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-5 mb-4 ${className}`}>
      {title && (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#1e4d72]">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          <div className="h-1 w-12 bg-[#dc143c] mt-2 rounded-full"></div>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
