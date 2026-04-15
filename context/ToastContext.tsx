import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastPayload {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem extends ToastPayload {
  id: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (payload: ToastPayload) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((payload: ToastPayload) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast: ToastItem = {
      id,
      type: payload.type || 'info',
      duration: payload.duration || 3000,
      message: payload.message
    };

    setToasts(prev => [toast, ...prev].slice(0, 3));
    window.setTimeout(() => removeToast(id), toast.duration);
  }, [removeToast]);

  const value = useMemo(() => ({ toasts, showToast, removeToast }), [toasts, showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
