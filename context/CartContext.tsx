
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { loadJSON, saveJSON, removeFromStorage } from '../utils/localStorage';

interface CartContextType {
  items: CartItem[];
  customerPhone: string;
  customerName: string;
  setCustomerInfo: (phone: string, name: string) => void;
  addItem: (product: Product, quantity: number) => string | null;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'minibar_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    const saved = loadJSON(CART_STORAGE_KEY, { items: [], phone: '', name: '' });
    setItems(saved.items);
    setCustomerPhone(saved.phone);
    setCustomerName(saved.name);
  }, []);

  useEffect(() => {
    saveJSON(CART_STORAGE_KEY, { items, phone: customerPhone, name: customerName });
  }, [items, customerPhone, customerName]);

  const setCustomerInfo = (phone: string, name: string) => {
    setCustomerPhone(phone);
    setCustomerName(name);
  };

  const addItem = (product: Product, quantity: number): string | null => {
    const existing = items.find(i => i.productId === product.id);
    const currentQuantity = existing ? existing.quantity : 0;
    const newTotal = currentQuantity + quantity;

    if (newTotal > product.stock) {
      return `Quantidade excede o estoque disponível (${product.stock}).`;
    }

    if (existing) {
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: newTotal } : i));
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity
      }]);
    }
    return null;
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setCustomerPhone('');
    setCustomerName('');
    removeFromStorage(CART_STORAGE_KEY);
  };

  const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      items, customerPhone, customerName, setCustomerInfo, addItem, removeItem, clearCart, total 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
