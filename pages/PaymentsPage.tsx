import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import Badge from '../components/UI/Badge';
import ModalConfirm from '../components/UI/ModalConfirm';
import SkeletonCard from '../components/UI/SkeletonCard';
import { useToast } from '../context/ToastContext';
import { reportsService } from '../services/reportsService';
import { salesService } from '../services/salesService';
import { Sale } from '../types';
import { formatBRL } from '../utils/currency';
import { formatDateTimeBR, formatISOToBR } from '../utils/date';
import { normalizePhone } from '../utils/phone';

const getSaleTotal = (sale: Sale): number =>
  sale.items.reduce((acc, item) => acc + item.subtotal, 0);

const sameSaleTimestamp = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  if (a === b) return true;

  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta === tb) return true;

  // Fallback para cobrir respostas com formatos diferentes, mantendo granularidade de minuto.
  return formatDateTimeBR(a) === formatDateTimeBR(b);
};

const PaymentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [phoneFilter, setPhoneFilter] = useState(searchParams.get('phone') || '');
  const selectedSaleParam = searchParams.get('sale') || '';
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [saleToPay, setSaleToPay] = useState<Sale | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);

      const data = await reportsService.getSalesReport(
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10)
      );

      const sorted = [...data.sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSales(sorted);
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message || 'Erro ao carregar vendas.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const filteredSales = useMemo(() => {
    const normalized = normalizePhone(phoneFilter || '');
    if (!normalized) return sales;
    return sales.filter(s => String(s.customerPhone ?? '').includes(normalized));
  }, [sales, phoneFilter]);

  const pendingCount = filteredSales.filter(s => s.status !== 'Paid').length;
  const selectedSale = useMemo(() => {
    if (!selectedSaleParam) return null;
    return (
      filteredSales.find(s => sameSaleTimestamp(s.createdAt, selectedSaleParam)) || null
    );
  }, [filteredSales, selectedSaleParam]);

  useEffect(() => {
    if (!selectedSaleParam || isLoading) return;
    if (!selectedSale) {
      setAlert({
        type: 'info',
        msg: 'A venda da URL nao foi encontrada no periodo/filtro atual. Verifique telefone e datas.'
      });
    }
  }, [selectedSaleParam, selectedSale, isLoading]);

  const markAsPaid = async () => {
    if (!saleToPay) return;

    setIsPaying(true);
    try {
      // Resolve o id real pelo historico do cliente para evitar divergencia de formato de data.
      const history = await salesService.getPurchaseHistory(saleToPay.customerPhone);
      const saleToPayTotal = getSaleTotal(saleToPay);
      const target =
        history.find(
          h =>
            h.status !== 'Paid' &&
            sameSaleTimestamp(h.createdAt, saleToPay.createdAt) &&
            Math.abs(getSaleTotal(h) - saleToPayTotal) < 0.01
        ) ||
        history.find(
          h => h.status !== 'Paid' && sameSaleTimestamp(h.createdAt, saleToPay.createdAt)
        );

      if (!target) {
        throw new Error('Nenhuma compra pendente correspondente encontrada.');
      }

      await salesService.markAsPaid(target.id);
      showToast({ type: 'success', message: 'Pagamento confirmado com sucesso' });
      setAlert({ type: 'success', msg: 'Pagamento atualizado.' });
      setSaleToPay(null);
      await loadSales();
    } catch {
      setAlert({ type: 'error', msg: 'Falha ao confirmar pagamento.' });
    } finally {
      setIsPaying(false);
    }
  };

  const exportCsv = () => {
    if (filteredSales.length === 0) return;

    const rows = [
      ['Cliente', 'Telefone', 'DataHora', 'Valor', 'Status'],
      ...filteredSales.map(sale => {
        const total = sale.items.reduce((acc, item) => acc + item.subtotal, 0);
        return [
          sale.customerName,
          sale.customerPhone,
          sale.createdAt,
          total.toFixed(2).replace('.', ','),
          sale.status === 'Paid' ? 'Pago' : 'Pendente'
        ];
      })
    ];

    const csv = rows.map(row => row.map(item => `"${item}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ultimas-compras.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-10">
      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <Card title="Ultimas compras" subtitle="Finalize pagamentos de vendas registradas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Filtrar por telefone"
            value={phoneFilter}
            onChange={e => setPhoneFilter(normalizePhone(e.target.value))}
            placeholder="55DDDNUMERO"
            maxLength={13}
          />
          <div className="md:col-span-2 flex gap-2 md:justify-end items-end pb-4">
            <Button variant="outline" fullWidth={false} onClick={loadSales}>Filtrar</Button>
            <Button variant="outline" fullWidth={false} onClick={exportCsv}>Exportar</Button>
          </div>
        </div>

        <div className="mb-2 text-xs text-gray-500">
          {filteredSales.length} registro(s) | {pendingCount} pendente(s)
        </div>

        {selectedSale && (
          <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs uppercase font-bold text-blue-700 mb-1">Venda selecionada</p>
            <p className="text-sm font-semibold text-[#1B3A5C]">
              {selectedSale.customerName} - {formatDateTimeBR(selectedSale.createdAt)}
            </p>
            <div className="mt-2 space-y-1">
              {selectedSale.items.map((item, idx) => (
                <div key={`${item.productName}-${idx}`} className="flex justify-between text-xs">
                  <span className="text-gray-700">{item.productName} x{item.quantity}</span>
                  <span className="font-semibold text-[#1B3A5C]">{formatBRL(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <SkeletonCard variant="purchase" count={4} />
        ) : filteredSales.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma compra encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-200">
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Data / Hora</th>
                  <th className="py-2">Valor</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale, idx) => {
                  const total = getSaleTotal(sale);
                  const pending = sale.status !== 'Paid';

                  return (
                    <tr key={`${sale.customerPhone}-${sale.createdAt}-${idx}`} className="border-b last:border-0 border-gray-100">
                      <td className="py-3">
                        <div className="font-semibold text-[#1B3A5C]">{sale.customerName}</div>
                        <div className="text-xs text-gray-500">{sale.customerPhone}</div>
                      </td>
                      <td className="py-3 text-gray-600">{formatDateTimeBR(sale.createdAt)}</td>
                      <td className={`py-3 font-bold ${pending ? 'text-[#dc143c]' : 'text-[#1B3A5C]'}`}>{formatBRL(total)}</td>
                      <td className="py-3">
                        <Badge variant={pending ? 'danger' : 'success'}>{pending ? 'Fiado' : 'Pago'}</Badge>
                      </td>
                      <td className="py-3">
                        {pending ? (
                          <button className="text-[#185FA5] text-sm font-semibold underline" onClick={() => setSaleToPay(sale)}>
                            pagar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">ok</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Resumo do periodo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-lg border border-gray-200 p-3 bg-white">
            <p className="text-xs text-gray-500">Inicio padrao</p>
            <p className="text-sm font-semibold">{formatISOToBR(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 bg-white">
            <p className="text-xs text-gray-500">Fim padrao</p>
            <p className="text-sm font-semibold">{formatISOToBR(new Date().toISOString())}</p>
          </div>
        </div>
      </Card>

      <ModalConfirm
        isOpen={!!saleToPay}
        title="Confirmar Pagamento"
        message={`Confirma o pagamento da venda de ${saleToPay?.customerName || ''}?`}
        onConfirm={markAsPaid}
        onCancel={() => setSaleToPay(null)}
        confirmLabel="Sim, pagar"
        isLoading={isPaying}
      />
    </div>
  );
};

export default PaymentsPage;
