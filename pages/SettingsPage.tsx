
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import Badge from '../components/UI/Badge';
import { loadJSON, saveJSON } from '../utils/localStorage';

const SETTINGS_KEY = 'minibar_settings';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [scriptUrl, setScriptUrl] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  // Captura a variável de ambiente para exibição
  const envUrl = (import.meta as any).env?.VITE_GAS_URL;

  useEffect(() => {
    const settings = loadJSON<{ scriptUrl?: string }>(SETTINGS_KEY, {});
    if (settings.scriptUrl) {
      setScriptUrl(settings.scriptUrl);
    }
  }, []);

  const handleSave = () => {
    // Se o usuário deixar vazio, ele está "limpando" para usar a variável do Vercel
    if (scriptUrl && !scriptUrl.startsWith('https://script.google.com')) {
      setAlert({ type: 'error', msg: 'A URL deve começar com https://script.google.com' });
      return;
    }
    
    saveJSON(SETTINGS_KEY, { scriptUrl: scriptUrl.trim() });
    setAlert({ type: 'success', msg: scriptUrl.trim() === '' 
      ? 'Configuração manual removida. Usando padrão do sistema.' 
      : 'Configuração manual salva com sucesso!' 
    });
  };

  const isUsingEnv = !scriptUrl.trim() && !!envUrl;
  const isUsingManual = !!scriptUrl.trim();

  return (
    <div className="space-y-4 pb-10">
      <div className="flex justify-start mb-2">
        <Button variant="secondary" fullWidth={false} className="py-1.5 px-4 text-sm" onClick={() => navigate('/')}>
          ← Voltar
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <Card title="⚙️ Conectividade" subtitle="Integração Google Sheets">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600">Status atual:</span>
          {isUsingEnv && <Badge variant="info">Padrão Vercel</Badge>}
          {isUsingManual && <Badge variant="success">Manual (Local)</Badge>}
          {!isUsingEnv && !isUsingManual && <Badge variant="danger">Não configurado</Badge>}
        </div>

        <Input 
          label="URL do Web App (API)" 
          value={scriptUrl} 
          onChange={(e) => setScriptUrl(e.target.value)} 
          placeholder={envUrl || "https://script.google.com/macros/s/.../exec"}
          helperText={
            scriptUrl.trim() === '' && envUrl 
              ? "Campo vazio: O sistema está usando a URL padrão configurada no deploy." 
              : "Insira uma URL aqui para sobrepor o padrão do sistema ou deixe vazio para resetar."
          }
        />

        <div className="bg-blue-50 p-4 rounded-xl mb-6 text-[11px] text-blue-800 leading-tight border border-blue-100">
          <p className="font-bold mb-1 italic">Como funciona?</p>
          <ul className="list-disc ml-4 space-y-1">
            <li><strong>Manual:</strong> Salva apenas neste aparelho/navegador.</li>
            <li><strong>Variável Vercel:</strong> Configurada no painel do Vercel (VITE_GAS_URL) para todos os acessos.</li>
            <li>Se você deixar este campo <strong>vazio</strong>, o sistema tentará buscar automaticamente a variável do Vercel.</li>
          </ul>
        </div>

        <Button onClick={handleSave}>
          {scriptUrl.trim() === '' ? 'Resetar para Padrão' : 'Salvar Alteração'}
        </Button>
      </Card>
      
      <Card title="Link da Planilha">
        <p className="text-xs text-gray-500 mb-4">Esta planilha contém os dados reais que a API (URL acima) manipula.</p>
        <Button variant="outline" onClick={() => window.open('https://docs.google.com/spreadsheets/d/11V2jDDbLQY3XEoygMKHYLgJGeoJFskwCWLtLx_h6cVU', '_blank')}>
          Abrir Planilha no Drive
        </Button>
      </Card>
    </div>
  );
};

export default SettingsPage;
