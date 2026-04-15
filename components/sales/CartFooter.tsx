import React from 'react';
import { formatBRL } from '../../utils/currency';
import { useViewport } from '../../hooks/useViewport';

interface CartFooterProps {
  total: number;
  itemCount: number;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}

const CartFooter: React.FC<CartFooterProps> = ({ total, itemCount, actionLabel, onAction, disabled }) => {
  const { isMobile } = useViewport();

  return (
    <div className={`${isMobile ? 'fixed left-0 right-0 bottom-14 z-40' : ''}`}>
      <div className={`${isMobile ? 'mx-3 mb-2 rounded-xl' : 'rounded-xl'} border border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-3 shadow-sm`}>
        <div>
          <p className="text-[11px] text-gray-500">{itemCount} item(ns)</p>
          <p className="text-lg font-bold text-[#1B3A5C]">{formatBRL(total)}</p>
        </div>
        <button
          className="h-11 px-5 rounded-lg bg-[#E8431A] text-white text-sm font-semibold disabled:opacity-50"
          onClick={onAction}
          disabled={disabled}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default CartFooter;
