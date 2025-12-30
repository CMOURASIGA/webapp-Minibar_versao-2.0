
import { Customer } from '../types';
import { apiClient } from './apiClient';

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    const response = await apiClient.call('getCustomers');
    // Mapeia os dados da planilha (nome, telefone) para o formato do app (id, name, phone)
    return (response.data || []).map((c: any) => ({
      id: c.telefone, // Usamos o telefone como ID único na planilha
      name: c.nome,
      phone: c.telefone
    }));
  },

  getByPhone: async (phone: string): Promise<Customer | null> => {
    const response = await apiClient.call('getCustomerByPhone', { telefone: phone });
    if (!response.data) return null;
    return {
      id: response.data.telefone,
      name: response.data.nome,
      phone: response.data.telefone
    };
  },

  create: async (data: Omit<Customer, 'id'>): Promise<any> => {
    return await apiClient.call('addCustomer', { nome: data.name, telefone: data.phone });
  },

  update: async (id: string, data: Partial<Customer>): Promise<any> => {
    return await apiClient.call('updateCustomer', { nome: data.name, telefone: id });
  },

  remove: async (id: string): Promise<any> => {
    return await apiClient.call('deleteCustomer', { telefone: id });
  }
};
