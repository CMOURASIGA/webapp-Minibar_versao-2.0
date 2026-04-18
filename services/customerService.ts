
import { Customer } from '../types';
import { apiClient } from './apiClient';

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    const response = await apiClient.call('getCustomers');
    // Mapeia os dados da planilha (nome, telefone) para o formato do app (id, name, phone)
    return (response.data || []).map((c: any) => ({
      id: c.id || c.telefone, // Preferência para ID por linha vindo do backend
      name: c.nome,
      phone: c.telefone || ''
    }));
  },

  getByPhone: async (phone: string): Promise<Customer | null> => {
    const response = await apiClient.call('getCustomerByPhone', { telefone: phone });
    if (!response.data) return null;
    return {
      id: response.data.id || response.data.telefone,
      name: response.data.nome,
      phone: response.data.telefone
    };
  },

  create: async (data: Omit<Customer, 'id'>): Promise<any> => {
    return await apiClient.call('addCustomer', { nome: data.name, telefone: data.phone });
  },

  update: async (id: string, data: Partial<Customer>, previousPhone?: string): Promise<any> => {
    return await apiClient.call('updateCustomer', {
      id,
      nome: data.name,
      telefone: data.phone,
      telefoneAnterior: previousPhone
    });
  },

  remove: async (id: string): Promise<any> => {
    return await apiClient.call('deleteCustomer', { id });
  }
};
