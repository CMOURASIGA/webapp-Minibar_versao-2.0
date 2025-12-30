
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import { loadJSON, saveJSON } from '../utils/localStorage';

const SETTINGS_KEY = 'minibar_settings';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [scriptUrl, setScriptUrl] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const settings = loadJSON<{ scriptUrl?: string }>(SETTINGS_KEY, {});
    if (settings.scriptUrl) setScriptUrl(settings.scriptUrl);
  }, []);

  const handleSave = () => {
    if (!scriptUrl.startsWith('https://script.google.com')) {
      setAlert({ type: 'error', msg: 'A URL deve ser uma URL válida de Web App do Google Script.' });
      return;
    }
    saveJSON(SETTINGS_KEY, { scriptUrl });
    setAlert({ type: 'success', msg: 'Configurações salvas com sucesso!' });
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex justify-start mb-2">
        <Button variant="secondary" fullWidth={false} className="py-1.5 px-4 text-sm" onClick={() => navigate('/')}>
          ← Voltar
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <Card title="⚙️ Configurações do Sistema" subtitle="Integração com Google Sheets">
        <Input 
          label="URL do Web App (Google Apps Script)" 
          value={scriptUrl} 
          onChange={(e) => setScriptUrl(e.target.value)} 
          placeholder="https://script.google.com/macros/s/.../exec"
          helperText="Você obtém esta URL ao fazer o 'Deploy' como 'Web App' no Google Script."
        />
        <div className="bg-blue-50 p-4 rounded-xl mb-6 text-xs text-blue-700 leading-relaxed border border-blue-100">
          <p className="font-bold mb-1">Dica:</p>
          <p>Se você configurar a variável <strong>VITE_GAS_URL</strong> no Vercel, este campo será preenchido automaticamente.</p>
        </div>
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </Card>
      
      <Card title="Planilha Vinculada">
        <p className="text-sm text-gray-600 mb-4">Certifique-se de que a aba de Produtos, Clientes e Vendas existem na sua planilha para evitar erros.</p>
        <Button variant="outline" onClick={() => window.open('https://docs.google.com/spreadsheets/d/11V2jDDbLQY3XEoygMKHYLgJGeoJFskwCWLtLx_h6cVU', '_blank')}>
          Abrir Planilha no Google Drive
        </Button>
      </Card>
    </div>
  );
};

export default SettingsPage;
