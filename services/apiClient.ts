
import { loadJSON } from '../utils/localStorage';

const SETTINGS_KEY = 'minibar_settings';

export const apiClient = {
  getScriptUrl: (): string => {
    const settings = loadJSON<{ scriptUrl?: string }>(SETTINGS_KEY, {});
    // Prioriza variável de ambiente se existir, senão usa o localStorage
    return settings.scriptUrl || (import.meta as any).env?.VITE_GAS_URL || '';
  },

  async call(action: string, payload: any = {}): Promise<any> {
    const url = this.getScriptUrl();
    if (!url) {
      throw new Error('URL do Google Apps Script não configurada.');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // GAS lida melhor com text/plain em POST simples
        },
        body: JSON.stringify({ action, ...payload }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success === false) {
        throw new Error(result.message || 'Erro desconhecido na API.');
      }
      return result;
    } catch (error) {
      console.error(`Erro ao chamar ação ${action}:`, error);
      throw error;
    }
  }
};
