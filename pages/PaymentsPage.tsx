import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { formatDateTimeBR } from '../utils/date';

const getSaleTotal = (sale: Sale): number =>
  sale.items.reduce((acc, item) => acc + item.subtotal, 0);

const normalizeText = (value: string): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const toISODateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatISODateOnlyToBR = (isoDate: string): string => {
  const [year, month, day] = (isoDate || '').split('-');
  if (!year || !month || !day) return isoDate || '';
  return `${day}/${month}/${year}`;
};

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
  const selectedSaleParam = searchParams.get('sale') || '';

  const [customerFilter, setCustomerFilter] = useState(searchParams.get('phone') || '');
  const [periodStart, setPeriodStart] = useState(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 30);
    return toISODateOnly(start);
  });
  const [periodEnd, setPeriodEnd] = useState(() => toISODateOnly(new Date()));

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [saleToPay, setSaleToPay] = useState<Sale | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const loadSales = useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    try {
      const data = await reportsService.getSalesReport(from, to);
      const sorted = [...data.sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSales(sorted);
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message || 'Erro ao carregar vendas.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSales(periodStart, periodEnd);
  }, [loadSales]);

  const applyFilters = async () => {
    if (!periodStart || !periodEnd) {
      setAlert({ type: 'error', msg: 'Informe inicio e fim do periodo.' });
      return;
    }

    if (periodStart > periodEnd) {
      setAlert({ type: 'error', msg: 'A data de inicio nao pode ser maior que a data de fim.' });
      return;
    }

    setAlert(null);
    await loadSales(periodStart, periodEnd);
  };

  const filteredSales = useMemo(() => {
    const rawQuery = customerFilter || '';
    const textQuery = normalizeText(rawQuery);
    const phoneQuery = rawQuery.replace(/\D/g, '');

    if (!textQuery && !phoneQuery) return sales;

    return sales.filter(sale => {
      const customerName = normalizeText(sale.customerName || '');
      const customerPhone = String(sale.customerPhone ?? '').replace(/\D/g, '');
      const matchesName = !!textQuery && customerName.includes(textQuery);
      const matchesPhone = !!phoneQuery && customerPhone.includes(phoneQuery);
      return matchesName || matchesPhone;
    });
  }, [sales, customerFilter]);

  const pendingCount = filteredSales.filter(s => s.status !== 'Paid').length;
  const totalFiltered = useMemo(
    () => filteredSales.reduce((acc, sale) => acc + getSaleTotal(sale), 0),
    [filteredSales]
  );
  const pendingAmount = useMemo(
    () => filteredSales
      .filter(sale => sale.status !== 'Paid')
      .reduce((acc, sale) => acc + getSaleTotal(sale), 0),
    [filteredSales]
  );

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
        msg: 'A venda da URL nao foi encontrada no periodo/filtro atual. Verifique cliente e datas.'
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
      await loadSales(periodStart, periodEnd);
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
        const total = getSaleTotal(sale);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            label="Nome ou telefone"
            value={customerFilter}
            onChange={e => setCustomerFilter(e.target.value)}
            placeholder="Ex: Maria ou 55DDDNUMERO"
          />
          <Input
            label="Inicio"
            type="date"
            value={periodStart}
            onChange={e => setPeriodStart(e.target.value)}
          />
          <Input
            label="Fim"
            type="date"
            value={periodEnd}
            onChange={e => setPeriodEnd(e.target.value)}
          />
          <div className="md:col-span-1 flex gap-2 md:justify-end items-end pb-4">
            <Button variant="outline" fullWidth={false} onClick={applyFilters}>Filtrar</Button>
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
            <p className="text-xs text-gray-500">Inicio aplicado</p>
            <p className="text-sm font-semibold">{formatISODateOnlyToBR(periodStart)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 bg-white">
            <p className="text-xs text-gray-500">Fim aplicado</p>
            <p className="text-sm font-semibold">{formatISODateOnlyToBR(periodEnd)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          <div className="rounded-lg border border-gray-200 p-3 bg-white">
            <p className="text-xs text-gray-500">Registros</p>
            <p className="text-sm font-semibold">{filteredSales.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 bg-white">
            <p className="text-xs text-gray-500">Pendente (valor)</p>
            <p className="text-sm font-semibold text-[#dc143c]">{formatBRL(pendingAmount)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 bg-white">
            <p className="text-xs text-gray-500">Total (valor)</p>
            <p className="text-sm font-semibold text-[#1B3A5C]">{formatBRL(totalFiltered)}</p>
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
