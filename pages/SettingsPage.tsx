
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

      <Card title="⚙️ Configurações" subtitle="Integração Google Sheets">
        <Input 
          label="URL do Web App" 
          value={scriptUrl} 
          onChange={(e) => setScriptUrl(e.target.value)} 
          placeholder="https://script.google.com/macros/s/.../exec"
        />
        <div className="bg-amber-50 p-4 rounded-xl mb-6 text-xs text-amber-800 leading-relaxed border border-amber-100">
          <p className="font-bold mb-2">⚠️ Atenção para Erros "Not Defined":</p>
          <p>Se você receber erros de "function not defined", certifique-se de que a função <strong>doPost</strong> e todas as outras funções (getCustomers, addProduct, etc) estão no <strong>mesmo projeto</strong> de Script no Google. Após qualquer alteração no Script, você <strong>deve</strong> criar uma "Nova Implantação" (New Deployment) para que as mudanças façam efeito.</p>
        </div>
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </Card>
      
      <Card title="Recursos">
        <Button variant="outline" onClick={() => window.open('https://docs.google.com/spreadsheets/d/11V2jDDbLQY3XEoygMKHYLgJGeoJFskwCWLtLx_h6cVU', '_blank')}>
          Abrir Planilha
        </Button>
      </Card>
    </div>
  );
};

export default SettingsPage;
