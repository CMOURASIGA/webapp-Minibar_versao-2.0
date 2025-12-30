
import { Product } from '../types';
import { apiClient } from './apiClient';

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await apiClient.call('getProducts');
    return (response.data || []).map((p: any) => ({
      id: p.id,
      name: p.nome,
      price: p.valor,
      stock: p.estoque
    }));
  },

  getById: async (id: string): Promise<Product | null> => {
    const products = await productService.getAll();
    return products.find(p => p.id.toString() === id.toString()) || null;
  },

  create: async (data: Omit<Product, 'id'>): Promise<any> => {
    return await apiClient.call('addProduct', { 
      nome: data.name, 
      valor: data.price, 
      quantidade: data.stock 
    });
  },

  update: async (id: string, data: Partial<Product>): Promise<any> => {
    const products = await productService.getAll();
    const current = products.find(p => p.id.toString() === id.toString());
    return await apiClient.call('updateProduct', { 
      id, 
      nome: data.name || current?.name, 
      valor: data.price || current?.price 
    });
  },

  remove: async (id: string): Promise<any> => {
    return await apiClient.call('deleteProduct', { id });
  },

  registerEntry: async (productId: string, quantity: number): Promise<any> => {
    return await apiClient.call('registerStockEntry', { productId, quantidade: quantity });
  },

  adjustStock: async (productId: string, newStock: number): Promise<any> => {
    return await apiClient.call('adjustStock', { productId, novoEstoque: newStock });
  }
};
