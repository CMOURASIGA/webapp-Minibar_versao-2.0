
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  light?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', light = false }) => {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeMap[size]} animate-spin rounded-full border-2 border-t-transparent ${light ? 'border-white' : 'border-[#1e4d72]'}`}></div>
    </div>
  );
};

export default Spinner;
