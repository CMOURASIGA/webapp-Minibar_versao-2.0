
import { loadJSON } from '../utils/localStorage';

const SETTINGS_KEY = 'minibar_settings';

export const apiClient = {
  /**
   * Obtém a URL do script seguindo a prioridade:
   * 1. Valor salvo manualmente no LocalStorage (pelo usuário na tela de Configurações)
   * 2. Valor definido na variável de ambiente VITE_GAS_URL (configurada no Vercel)
   * 3. String vazia (erro será tratado no call)
   */
  getScriptUrl: (): string => {
    const settings = loadJSON<{ scriptUrl?: string }>(SETTINGS_KEY, {});
    const manualUrl = settings.scriptUrl?.trim();
    const envUrl = (import.meta as any).env?.VITE_GAS_URL;

    // Se houver uma URL manual, ela tem prioridade absoluta
    if (manualUrl) {
      return manualUrl;
    }

    // Caso contrário, retorna a do ambiente ou vazio
    return envUrl || '';
  },

  async call(action: string, payload: any = {}): Promise<any> {
    const url = this.getScriptUrl();
    if (!url) {
      throw new Error('URL do Google Apps Script não encontrada. Configure a variável VITE_GAS_URL no Vercel ou insira a URL manualmente nas Configurações.');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, ...payload }),
      });

      const text = await response.text();
      let result;
      
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Resposta não-JSON do servidor:', text);
        throw new Error('O servidor retornou uma resposta inválida. Verifique se o Script foi implantado como "Qualquer pessoa" (Anyone).');
      }

      if (result.success === false) {
        throw new Error(result.message || 'Erro desconhecido na API.');
      }
      return result;
    } catch (error: any) {
      console.error(`Erro na ação ${action}:`, error);
      throw error;
    }
  }
};
