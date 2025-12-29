
import { SalesReport, ProductSummaryItem, InventoryReportItem } from '../types';
import { salesService } from './salesService';
import { productService } from './productService';

export const reportsService = {
  getSalesReport: async (from: string, to: string): Promise<SalesReport> => {
    const sales = await salesService.getAll();
    const filtered = sales.filter(s => {
      const date = s.createdAt.split('T')[0];
      return date >= from && date <= to;
    });

    const totalPaid = filtered
      .filter(s => s.status === 'Paid')
      .reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.subtotal, 0), 0);
    
    const totalPending = filtered
      .filter(s => s.status === 'Pending')
      .reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.subtotal, 0), 0);

    return {
      totalPaid,
      totalPending,
      totalOverall: totalPaid + totalPending,
      sales: filtered
    };
  },

  getProductSummary: async (from: string, to: string): Promise<ProductSummaryItem[]> => {
    const sales = await salesService.getAll();
    const filtered = sales.filter(s => {
      const date = s.createdAt.split('T')[0];
      return date >= from && date <= to;
    });

    const summary: Record<string, ProductSummaryItem> = {};

    filtered.forEach(sale => {
      sale.items.forEach(item => {
        if (!summary[item.productName]) {
          summary[item.productName] = {
            productName: item.productName,
            totalQuantity: 0,
            totalRevenue: 0,
            transactionsCount: 0
          };
        }
        summary[item.productName].totalQuantity += item.quantity;
        summary[item.productName].totalRevenue += item.subtotal;
        summary[item.productName].transactionsCount += 1;
      });
    });

    return Object.values(summary);
  },

  getInventoryReport: async (from: string, to: string): Promise<InventoryReportItem[]> => {
    const products = await productService.getAll();
    const sales = await salesService.getAll();
    
    // In this mock, we don't have a history of specific stock entries, 
    // so we'll simulate the report based on current stock and sales in the period.
    return products.map(p => {
      const exits = sales
        .filter(s => {
          const date = s.createdAt.split('T')[0];
          return date >= from && date <= to;
        })
        .reduce((sum, s) => {
          const item = s.items.find(i => i.productName === p.name);
          return sum + (item ? item.quantity : 0);
        }, 0);

      return {
        productName: p.name,
        entries: 0, // Mock: no specific entries tracked in history yet
        exits,
        initialBalance: p.stock + exits,
        currentBalance: p.stock
      };
    });
  }
};
