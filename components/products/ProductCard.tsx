import React from 'react';
import { Product } from '../../types';
import { formatBRL } from '../../utils/currency';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, quantity, onAdd, onRemove, disabled }) => {
  return (
    <div className={`relative rounded-xl border p-3 bg-white ${quantity > 0 ? 'border-[#1B3A5C]' : 'border-gray-200'} ${disabled ? 'opacity-60' : ''}`}>
      <span className="text-2xl leading-none">📦</span>
      <h4 className="text-sm font-semibold text-gray-800 mt-2">{product.name}</h4>
      <p className="text-sm font-bold text-[#1B3A5C]">{formatBRL(product.price)}</p>
      <p className="text-[10px] text-gray-500 mb-3">Estoque: {product.stock}</p>

      {quantity > 0 && (
        <span className="absolute top-2 right-2 w-5 h-5 text-[10px] font-bold rounded-full bg-[#E8431A] text-white flex items-center justify-center">
          {quantity}
        </span>
      )}

      {quantity > 0 ? (
        <div className="flex items-center gap-2">
          <button
            className="h-11 min-w-[44px] px-3 rounded-lg border border-gray-300 text-gray-700"
            onClick={onRemove}
            disabled={disabled}
          >
            -
          </button>
          <button
            className="h-11 flex-1 rounded-lg bg-[#1B3A5C] text-white text-sm font-semibold"
            onClick={onAdd}
            disabled={disabled}
          >
            Adicionar
          </button>
        </div>
      ) : (
        <button
          className="h-11 w-full rounded-lg bg-[#E8431A] text-white text-sm font-semibold"
          onClick={onAdd}
          disabled={disabled}
        >
          + Adicionar
        </button>
      )}
    </div>
  );
};

export default ProductCard;
