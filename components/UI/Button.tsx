
import React from 'react';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'carmim';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  fullWidth = true,
  className = '',
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] shadow-md disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: "bg-[#1e4d72] text-white hover:bg-[#153a56]",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    success: "bg-[#28a745] text-white hover:bg-[#218838]",
    danger: "bg-[#dc143c] text-white hover:bg-[#b21031]",
    outline: "border-2 border-[#1e4d72] text-[#1e4d72] bg-transparent hover:bg-[#1e4d72]/10 shadow-none",
    carmim: "bg-[#9b111e] text-white hover:bg-[#7a0d18]"
  };

  const widthStyle = fullWidth ? "w-full" : "w-auto";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner size="sm" light /> : children}
    </button>
  );
};

export default Button;
