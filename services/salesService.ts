
import { Sale, CartItem, SaleStatus } from '../types';
import { loadJSON, saveJSON } from '../utils/localStorage';
import { INITIAL_SALES } from './mockData';
import { generateId } from '../utils/id';
import { productService } from './productService';

const STORAGE_KEY = 'minibar_sales';

export const salesService = {
  getAll: async (): Promise<Sale[]> => {
    return loadJSON<Sale[]>(STORAGE_KEY, INITIAL_SALES);
  },

  registerSale: async (payload: { 
    customerPhone: string; 
    customerName: string; 
    items: CartItem[]; 
    status: SaleStatus; 
    requestId: string 
  }): Promise<void> => {
    const sales = await salesService.getAll();
    
    // Check for duplicate requestId
    if (sales.some(s => s.requestId === payload.requestId)) {
      console.warn('Duplicate sale detected, ignoring.');
      return;
    }

    const saleItems = payload.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }));

    const newSale: Sale = {
      id: generateId(),
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      items: saleItems,
      status: payload.status,
      createdAt: new Date().toISOString(),
      requestId: payload.requestId
    };

    // Update stocks
    for (const item of payload.items) {
      const prod = await productService.getById(item.productId);
      if (prod) {
        await productService.update(prod.id, { stock: prod.stock - item.quantity });
      }
    }

    saveJSON(STORAGE_KEY, [newSale, ...sales]);
  },

  getPurchaseHistory: async (phone: string): Promise<Sale[]> => {
    const sales = await salesService.getAll();
    return sales.filter(s => s.customerPhone === phone);
  },

  markAsPaid: async (saleId: string): Promise<void> => {
    const sales = await salesService.getAll();
    const index = sales.findIndex(s => s.id === saleId);
    if (index !== -1) {
      sales[index].status = 'Paid';
      saveJSON(STORAGE_KEY, sales);
    }
  },

  deleteSale: async (saleId: string): Promise<void> => {
    const sales = await salesService.getAll();
    // In a real app, deleting a sale might restore stock. Let's do it for consistency.
    const saleToDelete = sales.find(s => s.id === saleId);
    if (saleToDelete) {
      for (const item of saleToDelete.items) {
        const prod = await productService.getById(item.productId);
        if (prod) {
          await productService.update(prod.id, { stock: prod.stock + item.quantity });
        }
      }
    }
    const filtered = sales.filter(s => s.id !== saleId);
    saveJSON(STORAGE_KEY, filtered);
  },

  sendReceiptByEmail: async (phone: string, email: string): Promise<void> => {
    console.log(`Sending receipt for ${phone} to ${email}`);
    return new Promise(resolve => setTimeout(resolve, 1500));
  }
};
