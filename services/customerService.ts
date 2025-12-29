
import { Customer } from '../types';
import { loadJSON, saveJSON } from '../utils/localStorage';
import { INITIAL_CUSTOMERS } from './mockData';
import { generateId } from '../utils/id';

const STORAGE_KEY = 'minibar_customers';

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    const customers = loadJSON<Customer[]>(STORAGE_KEY, INITIAL_CUSTOMERS);
    return customers.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },

  getByPhone: async (phone: string): Promise<Customer | null> => {
    const customers = await customerService.getAll();
    return customers.find(c => c.phone === phone) || null;
  },

  create: async (data: Omit<Customer, 'id'>): Promise<Customer> => {
    const customers = await customerService.getAll();
    const newCustomer = { ...data, id: generateId() };
    saveJSON(STORAGE_KEY, [...customers, newCustomer]);
    return newCustomer;
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const customers = await customerService.getAll();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer not found');
    
    const updated = { ...customers[index], ...data };
    customers[index] = updated;
    saveJSON(STORAGE_KEY, customers);
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    // Check for sales before deleting in a real app
    const customers = await customerService.getAll();
    const filtered = customers.filter(c => c.id !== id);
    saveJSON(STORAGE_KEY, filtered);
  }
};
