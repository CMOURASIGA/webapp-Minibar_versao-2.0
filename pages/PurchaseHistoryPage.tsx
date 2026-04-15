import React, { useMemo, useState } from 'react';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import ModalConfirm from '../components/UI/ModalConfirm';
import SkeletonCard from '../components/UI/SkeletonCard';
import { useToast } from '../context/ToastContext';
import { Sale } from '../types';
import { salesService } from '../services/salesService';
import { normalizePhone, isValidPhone } from '../utils/phone';
import { formatBRL } from '../utils/currency';

interface ProductAggregate {
  productName: string;
  quantity: number;
  total: number;
}

const aggregateProducts = (sales: Sale[]): ProductAggregate[] => {
  const map = new Map<string, ProductAggregate>();

  sales.forEach(sale => {
    sale.items.forEach(item => {
      const key = item.productName;
      const current = map.get(key);
      if (current) {
        current.quantity += item.quantity;
        current.total += item.subtotal;
      } else {
        map.set(key, { productName: key, quantity: item.quantity, total: item.subtotal });
      }
    });
  });

  return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName, 'pt-BR', { sensitivity: 'base' }));
};

const PurchaseHistoryPage: React.FC = () => {
  const { showToast } = useToast();
  const [phone, setPhone] = useState('');
  const [history, setHistory] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleSearch = async () => {
    if (!isValidPhone(phone)) {
      setAlert({ type: 'error', msg: 'Telefone invalido (13 digitos).' });
      return;
    }

    setIsLoading(true);
    try {
      const results = await salesService.getPurchaseHistory(phone);
      setHistory(results);
      if (results.length === 0) {
        setAlert({ type: 'info', msg: 'Nenhuma compra encontrada para este cliente.' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message || 'Erro ao buscar historico.' });
    } finally {
      setIsLoading(false);
    }
  };

  const paidSales = useMemo(() => history.filter(s => s.status === 'Paid'), [history]);
  const pendingSales = useMemo(() => history.filter(s => s.status !== 'Paid'), [history]);

  const paidProducts = useMemo(() => aggregateProducts(paidSales), [paidSales]);
  const pendingProducts = useMemo(() => aggregateProducts(pendingSales), [pendingSales]);

  const totals = useMemo(() => {
    const paid = paidSales.reduce((acc, sale) => acc + sale.items.reduce((sum, i) => sum + i.subtotal, 0), 0);
    const pending = pendingSales.reduce((acc, sale) => acc + sale.items.reduce((sum, i) => sum + i.subtotal, 0), 0);
    return { paid, pending };
  }, [paidSales, pendingSales]);

  const handleConfirmPayment = async () => {
    setIsProcessingPayment(true);
    try {
      for (const sale of pendingSales) {
        await salesService.markAsPaid(sale.id);
      }

      showToast({ type: 'success', message: `${pendingSales.length} registro(s) pendente(s) marcados como pago` });
      setAlert({ type: 'success', msg: 'Pendencias atualizadas com sucesso.' });
      setIsPayModalOpen(false);
      await handleSearch();
    } catch (e) {
      setAlert({ type: 'error', msg: 'Erro ao processar pagamentos na planilha.' });
      showToast({ type: 'error', message: 'Falha ao processar pagamento' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const renderProductList = (products: ProductAggregate[], emptyMessage: string, tone: 'paid' | 'pending') => {
    if (products.length === 0) {
      return <p className="text-sm text-gray-500">{emptyMessage}</p>;
    }

    return (
      <div className="space-y-2">
        {products.map(product => (
          <div key={product.productName} className="rounded-lg border border-gray-200 px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1B3A5C]">{product.productName}</p>
              <p className="text-xs text-gray-500">Qtd: {product.quantity}</p>
            </div>
            <p className={`text-sm font-bold ${tone === 'paid' ? 'text-[#28a745]' : 'text-[#dc143c]'}`}>{formatBRL(product.total)}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-12">
      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <Card title="Historico por Cliente" subtitle="Consolidado de produtos pagos e pendentes">
        <Input
          label="Telefone do Cliente"
          value={phone}
          onChange={e => setPhone(normalizePhone(e.target.value))}
          placeholder="55DDDNUMERO"
          maxLength={13}
        />
        <Button onClick={handleSearch} isLoading={isLoading}>Buscar Historico</Button>
      </Card>

      {isLoading && <SkeletonCard variant="purchase" count={2} />}

      {!isLoading && history.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card title="Produtos Pagos" subtitle={`Total: ${formatBRL(totals.paid)}`}>
            {renderProductList(paidProducts, 'Nao ha produtos pagos para este cliente.', 'paid')}
          </Card>

          <Card title="Produtos Pendentes" subtitle={`Total: ${formatBRL(totals.pending)}`}>
            {renderProductList(pendingProducts, 'Nao ha produtos pendentes para este cliente.', 'pending')}
            {pendingSales.length > 0 && (
              <div className="mt-3">
                <Button variant="success" onClick={() => setIsPayModalOpen(true)}>
                  Marcar pendencias como pagas
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      <ModalConfirm
        isOpen={isPayModalOpen}
        title="Confirmar Recebimento"
        message={`Deseja marcar ${pendingSales.length} registro(s) pendente(s) como pago?`}
        onConfirm={handleConfirmPayment}
        onCancel={() => setIsPayModalOpen(false)}
        confirmLabel="Sim, Marcar Pago"
        isLoading={isProcessingPayment}
      />
    </div>
  );
};

export default PurchaseHistoryPage;
