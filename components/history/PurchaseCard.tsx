import React from 'react';
import { Sale } from '../../types';
import { formatBRL } from '../../utils/currency';
import { formatDateTimeBR } from '../../utils/date';

interface PurchaseCardProps {
  purchase: Sale;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
}

const PurchaseCard: React.FC<PurchaseCardProps> = ({
  purchase,
  selected,
  onToggleSelect,
  onMarkPaid,
  onDelete
}) => {
  const isPaid = purchase.status === 'Paid';
  const total = purchase.items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className={`rounded-xl border p-3 bg-white ${selected ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-800">{purchase.customerName}</h4>
          <p className="text-[11px] text-gray-500">{formatDateTimeBR(purchase.createdAt)}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {isPaid ? 'Pago' : 'Pendente'}
        </span>
      </div>

      <p className={`text-base font-bold mt-2 ${isPaid ? 'text-[#1B3A5C]' : 'text-[#E8431A]'}`}>{formatBRL(total)}</p>

      {!isPaid && onToggleSelect && (
        <label className="flex items-center gap-2 mt-3 text-xs text-gray-700">
          <input type="checkbox" checked={!!selected} onChange={() => onToggleSelect(purchase.id)} />
          Selecionar para pagamento em lote
        </label>
      )}

      <div className="flex gap-2 mt-3">
        {!isPaid && (
          <button
            className="h-11 px-3 rounded-lg bg-[#EBF2FA] text-[#185FA5] text-xs font-semibold"
            onClick={() => onMarkPaid(purchase.id)}
          >
            Marcar pago
          </button>
        )}
        <button
          className="h-11 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold"
          onClick={() => onDelete(purchase.id)}
        >
          Excluir
        </button>
      </div>
    </div>
  );
};

export default PurchaseCard;
