
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import Badge from '../components/UI/Badge';
import Spinner from '../components/UI/Spinner';
import ModalConfirm from '../components/UI/ModalConfirm';
import { Sale } from '../types';
import { salesService } from '../services/salesService';
import { normalizePhone, isValidPhone } from '../utils/phone';
import { formatBRL } from '../utils/currency';
import { formatDateTimeBR } from '../utils/date';

const PurchaseHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [history, setHistory] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);
  
  // Modais
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [salesToPay, setSalesToPay] = useState<string[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);

  const handleSearch = async (keepSelection = false) => {
    if (!isValidPhone(phone)) {
      setAlert({ type: 'error', msg: 'Telefone inválido (13 dígitos).' });
      return;
    }

    setIsLoading(true);
    if (!keepSelection) setSalesToPay([]);
    
    try {
      const results = await salesService.getPurchaseHistory(phone);
      setHistory(results);
      if (results.length === 0) {
        setAlert({ type: 'info', msg: 'Nenhuma compra encontrada para este cliente.' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message || 'Erro ao buscar histórico.' });
    }
    setIsLoading(false);
  };

  const toggleSaleSelection = (id: string) => {
    setSalesToPay(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handlePaySingle = (id: string) => {
    setSalesToPay([id]);
    setIsPayModalOpen(true);
  };

  const handlePayBatch = () => {
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Processa cada pagamento
      for (const saleId of salesToPay) {
        await salesService.markAsPaid(saleId);
      }
      
      setAlert({ type: 'success', msg: `${salesToPay.length} pagamento(s) confirmado(s)!` });
      setIsPayModalOpen(false);
      setSalesToPay([]);
      
      // Força o recarregamento dos dados para atualizar os saldos
      await handleSearch(); 
    } catch (e) {
      setAlert({ type: 'error', msg: 'Erro ao processar pagamentos na planilha.' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const confirmDelete = async () => {
    if (saleToDelete) {
      setIsLoading(true);
      try {
        await salesService.deleteSale(saleToDelete);
        setIsDeleteModalOpen(false);
        setSaleToDelete(null);
        await handleSearch();
      } catch (e) {
        setAlert({ type: 'error', msg: 'Erro ao excluir.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Cálculos de Totais (Agora usando status normalizado)
  const totals = history.reduce((acc, sale) => {
    const saleTotal = sale.items.reduce((sum, item) => sum + item.subtotal, 0);
    if (sale.status === 'Paid') {
      acc.paid += saleTotal;
    } else {
      acc.pending += saleTotal;
    }
    return acc;
  }, { paid: 0, pending: 0 });

  const totalToPay = history
    .filter(s => salesToPay.includes(s.id))
    .reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.subtotal, 0), 0);

  return (
    <div className="space-y-4 pb-28">
      <div className="flex justify-start mb-2">
        <Button variant="secondary" fullWidth={false} className="py-1.5 px-4 text-sm" onClick={() => navigate('/')}>
          ← Voltar
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <Card title="📊 Consultar Histórico" subtitle="Digite o telefone cadastrado">
        <Input 
          label="Telefone do Cliente" 
          value={phone} 
          onChange={(e) => setPhone(normalizePhone(e.target.value))} 
          placeholder="5521..."
          maxLength={13}
        />
        <Button onClick={() => handleSearch()} isLoading={isLoading}>Buscar Histórico</Button>
      </Card>

      {history.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/90 p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
              <span className="text-[9px] uppercase font-black text-gray-400 tracking-tighter">Total Pago</span>
              <span className="text-xl font-black text-[#28a745]">{formatBRL(totals.paid)}</span>
            </div>
            <div className="bg-white/90 p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
              <span className="text-[9px] uppercase font-black text-gray-400 tracking-tighter">A Receber</span>
              <span className="text-xl font-black text-[#dc143c]">{formatBRL(totals.pending)}</span>
            </div>
          </div>

          <h3 className="text-xs font-black text-white uppercase tracking-widest px-1 mb-2">Detalhamento</h3>

          <div className="space-y-3">
            {history.map(sale => {
              const isPaid = sale.status === 'Paid';
              const isSelected = salesToPay.includes(sale.id);
              
              return (
                <div key={sale.id} className="relative group">
                  <Card className={`!mb-0 transition-all duration-300 ${isPaid ? 'bg-green-50/80 border-green-200' : isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="flex gap-3">
                      {!isPaid && (
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSaleSelection(sale.id)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400">{formatDateTimeBR(sale.createdAt)}</span>
                            {isPaid && <span className="text-[9px] font-bold text-green-600 uppercase">✓ Recebido</span>}
                          </div>
                          <Badge variant={isPaid ? 'success' : 'danger'}>
                            {isPaid ? 'Pago' : 'Pendente'}
                          </Badge>
                        </div>

                        <div className="space-y-1 mb-3">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-sm font-bold text-gray-700">{item.productName} <span className="text-gray-400 font-normal">x{item.quantity}</span></span>
                              <span className="text-sm font-black text-[#1e4d72]">{formatBRL(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <button 
                            className="text-[10px] font-bold text-red-400 hover:text-red-600 underline"
                            onClick={() => { setSaleToDelete(sale.id); setIsDeleteModalOpen(true); }}
                          >
                            Excluir Registro
                          </button>
                          
                          {!isPaid && (
                            <button 
                              className="bg-[#28a745] text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-transform"
                              onClick={() => handlePaySingle(sale.id)}
                            >
                              PAGAR ESTE
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Botão Flutuante de Pagamento em Lote */}
      {salesToPay.length > 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[380px] px-4 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <button 
            onClick={handlePayBatch}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center ring-4 ring-white"
          >
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-black uppercase opacity-80">Pagar Selecionados ({salesToPay.length})</span>
              <span className="text-lg font-black">{formatBRL(totalToPay)}</span>
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-lg font-black">PAGAR TUDO</span>
          </button>
        </div>
      )}

      <ModalConfirm 
        isOpen={isPayModalOpen} 
        title="Confirmar Recebimento" 
        message={`Deseja marcar ${salesToPay.length === 1 ? 'este item' : 'estes ' + salesToPay.length + ' itens'} como PAGO? Valor total: ${formatBRL(totalToPay)}.`}
        onConfirm={handleConfirmPayment}
        onCancel={() => { setIsPayModalOpen(false); if(salesToPay.length === 1) setSalesToPay([]); }}
        confirmLabel="Sim, Recebi!"
        isLoading={isProcessingPayment}
      />

      <ModalConfirm 
        isOpen={isDeleteModalOpen} 
        title="Excluir Registro" 
        message="Esta ação apagará o registro permanentemente. Continuar?"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default PurchaseHistoryPage;
