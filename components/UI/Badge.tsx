
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'info' | 'neutral';
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: "bg-[#28a745]/10 text-[#28a745] border-[#28a745]/20",
    danger: "bg-[#dc143c]/10 text-[#dc143c] border-[#dc143c]/20",
    info: "bg-[#1e4d72]/10 text-[#1e4d72] border-[#1e4d72]/20",
    neutral: "bg-gray-100 text-gray-600 border-gray-200"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]}`}>
      {children}
    </span>
  );
};

export default Badge;
