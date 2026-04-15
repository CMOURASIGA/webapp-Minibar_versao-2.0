import React from 'react';
import { useViewport } from '../../hooks/useViewport';
import { useToast } from '../../context/ToastContext';

const styleByType = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-[#1B3A5C] text-white'
};

const iconByType = {
  success: '✓',
  error: '!',
  warning: '!',
  info: 'i'
};

const Toast: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const { isMobile } = useViewport();

  return (
    <div className={`fixed z-[80] pointer-events-none ${isMobile ? 'bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm' : 'bottom-5 right-5 w-[360px]'}`}>
      <div className="flex flex-col gap-2">
        {toasts.map(toast => (
          <button
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto w-full rounded-xl px-3 py-2 text-sm shadow-lg flex items-center gap-2 text-left animate-in fade-in slide-in-from-bottom-2 ${styleByType[toast.type || 'info']}`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {iconByType[toast.type || 'info']}
            </span>
            <span className="leading-tight">{toast.message}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toast;
