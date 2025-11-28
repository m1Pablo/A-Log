import React from 'react';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary';
  icon?: React.ReactNode;
}

export const RetroButton: React.FC<RetroButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyle = "font-mono uppercase px-4 py-2 border-2 transition-all duration-75 active:translate-y-1 active:shadow-none flex items-center justify-center gap-2";
  
  const variants = {
    // Lime Green
    primary: "border-[#8AFF80] text-[#8AFF80] hover:bg-[#8AFF80] hover:text-[#0B0D0F] shadow-[4px_4px_0px_0px_rgba(138,255,128,0.5)]",
    // Steel Blue
    secondary: "border-[#708CA9] text-[#708CA9] hover:bg-[#708CA9] hover:text-[#0B0D0F] shadow-[4px_4px_0px_0px_rgba(112,140,169,0.5)]",
    // Hot Pink
    danger: "border-[#FF80BF] text-[#FF80BF] hover:bg-[#FF80BF] hover:text-[#0B0D0F] shadow-[4px_4px_0px_0px_rgba(255,128,191,0.5)]"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};