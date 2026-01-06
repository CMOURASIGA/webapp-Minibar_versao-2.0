
import { Sale, CartItem, SaleStatus } from '../types';
import { apiClient } from './apiClient';

export const salesService = {
  registerSale: async (payload: { 
    customerPhone: string; 
    customerName: string; 
    items: CartItem[]; 
    status: SaleStatus; 
    requestId: string 
  }): Promise<void> => {
    await apiClient.call('registerPurchase', {
      telefone: payload.customerPhone,
      pago: payload.status === 'Paid',
      requestId: payload.requestId,
      items: payload.items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.price,
        subtotal: i.price * i.quantity
      }))
    });
  },

  getPurchaseHistory: async (phone: string): Promise<Sale[]> => {
    const response = await apiClient.call('getPurchaseHistory', { telefone: phone });
    return (response.data || []).map((s: any, idx: number) => {
      // Normaliza o status vindo da planilha (Português -> Inglês interno)
      let normalizedStatus: SaleStatus = 'Pending';
      if (s.status === 'Pago' || s.status === 'Paid' || s.status === 'SIM') {
        normalizedStatus = 'Paid';
      }

      return {
        // ID composto para facilitar a busca no backend: DATA|TELEFONE|INDEX
        id: `${s.data}|${s.telefone}|${idx}`,
        customerName: s.nome,
        customerPhone: s.telefone,
        items: [{
          productId: '0',
          productName: s.produto,
          unitPrice: s.valorUnitario,
          quantity: s.quantity || s.quantidade,
          subtotal: s.subtotal
        }],
        status: normalizedStatus,
        createdAt: s.data,
        requestId: ''
      };
    });
  },

  markAsPaid: async (saleId: string): Promise<void> => {
    const [dataISO, telefone] = saleId.split('|');
    await apiClient.call('markPurchaseAsPaid', { dataISO, telefone });
  },

  deleteSale: async (saleId: string): Promise<void> => {
    const [dataISO, telefone] = saleId.split('|');
    await apiClient.call('deletePurchase', { dataISO, telefone });
  },

  sendReceiptByEmail: async (phone: string, email: string): Promise<void> => {
    await apiClient.call('sendPurchaseHistoryEmail', { phone, recipientEmail: email });
  }
};
