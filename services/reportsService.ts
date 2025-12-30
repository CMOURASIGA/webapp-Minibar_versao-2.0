
import { SalesReport, ProductSummaryItem, InventoryReportItem } from '../types';
import { apiClient } from './apiClient';

export const reportsService = {
  getSalesReport: async (from: string, to: string): Promise<SalesReport> => {
    const response = await apiClient.call('getSalesReport', { startDate: from, endDate: to });
    return {
      totalPaid: response.totalPago || 0,
      totalPending: response.totalPendente || 0,
      totalOverall: response.totalGeral || 0,
      sales: (response.vendas || []).map((s: any, idx: number) => ({
        id: idx.toString(),
        customerName: s.nome,
        customerPhone: s.telefone,
        items: [{ productName: s.produto, subtotal: s.subtotal, quantity: s.quantidade, productId: '0', unitPrice: s.valorUnitario }],
        status: s.status,
        createdAt: s.data,
        requestId: ''
      }))
    };
  },

  getProductSummary: async (from: string, to: string): Promise<ProductSummaryItem[]> => {
    const response = await apiClient.call('getProductSalesSummary', { startDate: from, endDate: to });
    return (response.produtos || []).map((p: any) => ({
      productName: p.produto,
      totalQuantity: p.quantidadeTotal,
      totalRevenue: p.faturamentoTotal,
      transactionsCount: p.transacoes
    }));
  },

  getInventoryReport: async (from: string, to: string): Promise<InventoryReportItem[]> => {
    const response = await apiClient.call('getInventoryReport', { startDate: from, endDate: to });
    return (response.itens || []).map((i: any) => ({
      productName: i.produto,
      entries: i.entradas,
      exits: i.saidas,
      initialBalance: i.saldoInicialEstimado,
      currentBalance: i.saldoAtual
    }));
  }
};
