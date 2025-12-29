
import React from 'react';
import Button from './Button';

interface ModalConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  isLoading?: boolean;
}

const ModalConfirm: React.FC<ModalConfirmProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', isLoading 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-6">
          <h3 className="text-xl font-bold text-[#1e4d72] mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
            <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;
