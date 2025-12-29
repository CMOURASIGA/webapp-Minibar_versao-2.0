
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import Spinner from '../components/UI/Spinner';
import Badge from '../components/UI/Badge';
import { reportsService } from '../services/reportsService';
import { maskDateInput, parseBRToISO } from '../utils/date';
import { formatBRL } from '../utils/currency';
import { formatISOToBR } from '../utils/date';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'inventory'>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [salesData, setSalesData] = useState<any>(null);
  const [productData, setProductData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);

  useEffect(() => {
    // Set default range: last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    setStartDate(formatISOToBR(start.toISOString()));
    setEndDate(formatISOToBR(end.toISOString()));
  }, []);

  const generateReport = async () => {
    const from = parseBRToISO(startDate);
    const to = parseBRToISO(endDate);
    
    if (!from || !to) {
      setError('Datas inválidas.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      if (activeTab === 'sales') {
        const res = await reportsService.getSalesReport(from, to);
        setSalesData(res);
      } else if (activeTab === 'products') {
        const res = await reportsService.getProductSummary(from, to);
        setProductData(res);
      } else if (activeTab === 'inventory') {
        const res = await reportsService.getInventoryReport(from, to);
        setInventoryData(res);
      }
    } catch (e) {
      setError('Falha ao gerar relatório.');
    }
    setIsLoading(false);
  };

  const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
    <button 
      onClick={() => { setActiveTab(id); setSalesData(null); setProductData([]); setInventoryData([]); }}
      className={`flex-1 py-3 text-xs font-bold transition-all ${activeTab === id ? 'text-[#1e4d72] border-b-2 border-[#dc143c]' : 'text-gray-400'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4 pb-10">
      <div className="flex justify-start mb-2">
        <Button 
          variant="secondary" 
          fullWidth={false} 
          className="py-1.5 px-4 text-sm" 
          onClick={() => navigate('/')}
        >
          ← Voltar
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="flex border-b">
          <TabButton id="sales" label="Vendas" />
          <TabButton id="products" label="Resumo" />
          <TabButton id="inventory" label="Estoque" />
        </div>
        <div className="p-4">
          <div className="flex gap-3 mb-4">
            <Input label="Início" value={startDate} onChange={(e) => setStartDate(maskDateInput(e.target.value))} placeholder="DD/MM/AAAA" />
            <Input label="Fim" value={endDate} onChange={(e) => setEndDate(maskDateInput(e.target.value))} placeholder="DD/MM/AAAA" />
          </div>
          <Button onClick={generateReport} isLoading={isLoading}>Gerar Relatório</Button>
        </div>
      </Card>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {isLoading && <Card><Spinner /></Card>}

      {!isLoading && activeTab === 'sales' && salesData && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/90 p-2 rounded-xl text-center border">
              <p className="text-[8px] uppercase font-bold text-gray-400">Pago</p>
              <p className="text-xs font-bold text-[#28a745]">{formatBRL(salesData.totalPaid)}</p>
            </div>
            <div className="bg-white/90 p-2 rounded-xl text-center border">
              <p className="text-[8px] uppercase font-bold text-gray-400">Pendente</p>
              <p className="text-xs font-bold text-[#dc143c]">{formatBRL(salesData.totalPending)}</p>
            </div>
            <div className="bg-white/90 p-2 rounded-xl text-center border">
              <p className="text-[8px] uppercase font-bold text-gray-400">Total</p>
              <p className="text-xs font-bold text-[#1e4d72]">{formatBRL(salesData.totalOverall)}</p>
            </div>
          </div>
          <Card title="Vendas Detalhadas">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1e4d72]/5">
                  <tr>
                    <th className="p-2 border-b">Data</th>
                    <th className="p-2 border-b">Cliente</th>
                    <th className="p-2 border-b">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.sales.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50 border-b last:border-0">
                      <td className="p-2">{formatISOToBR(s.createdAt)}</td>
                      <td className="p-2">{s.customerName} <br/><span className="text-[8px] text-gray-400">{s.status}</span></td>
                      <td className="p-2 font-bold">{formatBRL(s.items.reduce((acc: number, i: any) => acc + i.subtotal, 0))}</td>
                    </tr>
                  ))}
                  {salesData.sales.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400">Nenhuma venda no período.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {!isLoading && activeTab === 'products' && productData.length > 0 && (
        <Card title="Resumo por Produto">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1e4d72]/5">
                <tr>
                  <th className="p-2 border-b">Produto</th>
                  <th className="p-2 border-b">Qtd</th>
                  <th className="p-2 border-b">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {productData.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 border-b last:border-0">
                    <td className="p-2 font-medium">{p.productName}</td>
                    <td className="p-2">{p.totalQuantity}</td>
                    <td className="p-2 font-bold">{formatBRL(p.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!isLoading && activeTab === 'inventory' && inventoryData.length > 0 && (
        <Card title="Relatório de Estoque">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1e4d72]/5">
                <tr>
                  <th className="p-2 border-b">Produto</th>
                  <th className="p-2 border-b">Ini.</th>
                  <th className="p-2 border-b">Sai.</th>
                  <th className="p-2 border-b">Atu.</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 border-b last:border-0">
                    <td className="p-2 font-medium">{item.productName}</td>
                    <td className="p-2">{item.initialBalance}</td>
                    <td className="p-2 text-red-500">{item.exits}</td>
                    <td className="p-2 font-bold text-[#28a745]">{item.currentBalance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
