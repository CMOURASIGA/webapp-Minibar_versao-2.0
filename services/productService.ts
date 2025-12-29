
import { Product } from '../types';
import { loadJSON, saveJSON } from '../utils/localStorage';
import { INITIAL_PRODUCTS } from './mockData';
import { generateId } from '../utils/id';

const STORAGE_KEY = 'minibar_products';

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const products = loadJSON<Product[]>(STORAGE_KEY, INITIAL_PRODUCTS);
    return products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },

  getById: async (id: string): Promise<Product | null> => {
    const products = await productService.getAll();
    return products.find(p => p.id === id) || null;
  },

  create: async (data: Omit<Product, 'id'>): Promise<Product> => {
    const products = await productService.getAll();
    const newProduct = { ...data, id: generateId() };
    saveJSON(STORAGE_KEY, [...products, newProduct]);
    return newProduct;
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const products = await productService.getAll();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    const updated = { ...products[index], ...data };
    products[index] = updated;
    saveJSON(STORAGE_KEY, products);
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    const products = await productService.getAll();
    const filtered = products.filter(p => p.id !== id);
    saveJSON(STORAGE_KEY, filtered);
  },

  registerEntry: async (productId: string, quantity: number): Promise<void> => {
    const product = await productService.getById(productId);
    if (!product) throw new Error('Product not found');
    await productService.update(productId, { stock: product.stock + quantity });
  },

  adjustStock: async (productId: string, newStock: number): Promise<void> => {
    await productService.update(productId, { stock: newStock });
  }
};
