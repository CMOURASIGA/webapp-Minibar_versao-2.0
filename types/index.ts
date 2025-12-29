
export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type SaleStatus = 'Paid' | 'Pending';

export interface Sale {
  id: string;
  customerName: string;
  customerPhone: string;
  items: SaleItem[];
  status: SaleStatus;
  createdAt: string;
  requestId: string;
}

export interface SalesReport {
  totalPaid: number;
  totalPending: number;
  totalOverall: number;
  sales: Sale[];
}

export interface ProductSummaryItem {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  transactionsCount: number;
}

export interface InventoryReportItem {
  productName: string;
  entries: number;
  exits: number;
  initialBalance: number;
  currentBalance: number;
}
