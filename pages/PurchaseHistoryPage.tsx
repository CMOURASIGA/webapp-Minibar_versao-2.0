
import React, { useState } from 'react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);

  const handleSearch = async () => {
    if (!isValidPhone(phone)) {
      setAlert({ type: 'error', msg: 'Telefone inválido (13 dígitos).' });
      return;
    }

    setIsLoading(true);
    try {
      const results = await salesService.getPurchaseHistory(phone);
      setHistory(results);
      if (results.length === 0) {
        setAlert({ type: 'info', msg: 'Nenhuma compra encontrada para este cliente.' });
      } else {
        setAlert(null);
      }
    } catch (e) {
      setAlert({ type: 'error', msg: 'Erro ao buscar histórico.' });
    }
    setIsLoading(false);
  };

  const handleMarkAsPaid = async (id: string) => {
    await salesService.markAsPaid(id);
    handleSearch();
  };

  const handleDeleteClick = (id: string) => {
    setSaleToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (saleToDelete) {
      await salesService.deleteSale(saleToDelete);
      setIsModalOpen(false);
      setSaleToDelete(null);
      handleSearch();
    }
  };

  const handleSendReceipt = async () => {
    if (!email.includes('@')) {
      setAlert({ type: 'error', msg: 'E-mail inválido.' });
      return;
    }
    setIsSendingReceipt(true);
    await salesService.sendReceiptByEmail(phone, email);
    setIsSendingReceipt(false);
    setAlert({ type: 'success', msg: 'Recibo enviado com sucesso!' });
  };

  const totals = history.reduce((acc, sale) => {
    const saleTotal = sale.items.reduce((sum, item) => sum + item.subtotal, 0);
    acc.total += saleTotal;
    if (sale.status === 'Paid') acc.paid += saleTotal;
    else acc.pending += saleTotal;
    return acc;
  }, { total: 0, paid: 0, pending: 0 });

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

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <Card title="📊 Consultar Histórico">
        <Input 
          label="Telefone do Cliente" 
          value={phone} 
          onChange={(e) => setPhone(normalizePhone(e.target.value))} 
          placeholder="55DDDNÚMERO"
          maxLength={13}
        />
        <Button onClick={handleSearch} isLoading={isLoading}>Buscar Histórico</Button>
      </Card>

      {history.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/90 p-3 rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400">Pago</p>
              <p className="text-lg font-bold text-[#28a745]">{formatBRL(totals.paid)}</p>
            </div>
            <div className="bg-white/90 p-3 rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400">Pendente</p>
              <p className="text-lg font-bold text-[#dc143c]">{formatBRL(totals.pending)}</p>
            </div>
          </div>

          <div className="space-y-4">
            {history.map(sale => (
              <Card key={sale.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-400">{formatDateTimeBR(sale.createdAt)}</span>
                  <Badge variant={sale.status === 'Paid' ? 'success' : 'danger'}>
                    {sale.status === 'Paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
                <div className="space-y-1 mb-3">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span className="text-gray-700">{item.productName} (x{item.quantity})</span>
                      <span className="font-semibold">{formatBRL(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="font-bold text-[#1e4d72]">Total: {formatBRL(sale.items.reduce((s, i) => s + i.subtotal, 0))}</span>
                  <div className="flex gap-2">
                    {sale.status === 'Pending' && (
                      <button className="text-green-500 text-sm font-bold p-1" onClick={() => handleMarkAsPaid(sale.id)}>Pagar</button>
                    )}
                    <button className="text-red-500 text-sm font-bold p-1" onClick={() => handleDeleteClick(sale.id)}>Excluir</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totals.paid > 0 && (
            <Card title="📧 Enviar Recibo">
              <Input 
                label="E-mail do Cliente" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="email@exemplo.com"
              />
              <Button variant="outline" onClick={handleSendReceipt} isLoading={isSendingReceipt}>
                Enviar Recibo por E-mail
              </Button>
            </Card>
          )}
        </>
      )}

      <ModalConfirm 
        isOpen={isModalOpen} 
        title="Excluir Compra" 
        message="Tem certeza que deseja excluir esta compra? O estoque dos produtos será restaurado."
        onConfirm={confirmDelete}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default PurchaseHistoryPage;
