
import { Customer, Product, Sale } from '../types';

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'João Silva', phone: '5511999999999' },
  { id: '2', name: 'Maria Souza', phone: '5511888888888' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Água Mineral', price: 3.50, stock: 50 },
  { id: '2', name: 'Coca-Cola Lata', price: 6.00, stock: 30 },
  { id: '3', name: 'Salgadinho', price: 5.00, stock: 20 },
  { id: '4', name: 'Chocolate', price: 4.50, stock: 15 },
];

export const INITIAL_SALES: Sale[] = [];
