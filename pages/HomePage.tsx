import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SkeletonCard from '../components/UI/SkeletonCard';
import Badge from '../components/UI/Badge';
import { reportsService } from '../services/reportsService';
import { productService } from '../services/productService';
import { Product, ProductSummaryItem, Sale } from '../types';
import { formatBRL } from '../utils/currency';
import { formatDateTimeBR, formatISOToBR } from '../utils/date';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({ totalPaid: 0, totalPending: 0, totalOverall: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSummaryItem[]>([]);
  const [latestSales, setLatestSales] = useState<Sale[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const fromToday = now.toISOString().slice(0, 10);

        const startLatest = new Date();
        startLatest.setDate(now.getDate() - 7);

        const [salesToday, allProducts, top, recentSales] = await Promise.all([
          reportsService.getSalesReport(fromToday, fromToday),
          productService.getAll(),
          reportsService.getProductSummary(fromToday, fromToday),
          reportsService.getSalesReport(startLatest.toISOString().slice(0, 10), fromToday)
        ]);

        setMetrics({
          totalPaid: salesToday.totalPaid,
          totalPending: salesToday.totalPending,
          totalOverall: salesToday.totalOverall
        });

        setProducts(allProducts);

        const topSlice = top
          .slice(0, 5)
          .sort((a, b) => a.productName.localeCompare(b.productName, 'pt-BR', { sensitivity: 'base' }));
        setTopProducts(topSlice);

        const recentSorted = [...recentSales.sales]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6);
        setLatestSales(recentSorted);
      } catch {
        // home continua funcional mesmo sem dados
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const criticalStock = useMemo(
    () =>
      products
        .filter(p => p.stock <= 5)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
        .slice(0, 5),
    [products]
  );

  return (
    <div className="space-y-4 pb-10">
      <Card title="Painel" subtitle={formatISOToBR(new Date().toISOString())}>
        {isLoading ? (
          <SkeletonCard variant="metric" count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Pago</p>
              <p className="text-sm font-bold text-[#28a745]">{formatBRL(metrics.totalPaid)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Pendente</p>
              <p className="text-sm font-bold text-[#dc143c]">{formatBRL(metrics.totalPending)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Total</p>
              <p className="text-sm font-bold text-[#1B3A5C]">{formatBRL(metrics.totalOverall)}</p>
            </div>
          </div>
        )}
      </Card>

      <Card title="Ultimas Compras" subtitle="Compras mais recentes registradas">
        {isLoading ? (
          <SkeletonCard variant="purchase" count={3} />
        ) : latestSales.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma compra recente encontrada.</p>
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
                {latestSales.map((sale, idx) => {
                  const total = sale.items.reduce((acc, item) => acc + item.subtotal, 0);
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
                        <button
                          className="text-[#185FA5] text-sm font-semibold underline"
                          onClick={() =>
                            navigate(
                              `/payments?phone=${sale.customerPhone}&sale=${encodeURIComponent(sale.createdAt)}`
                            )
                          }
                        >
                          {pending ? 'pagar' : 'ver'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Estoque Critico" subtitle="Produtos com baixo saldo">
          {isLoading ? (
            <SkeletonCard variant="product" count={3} />
          ) : criticalStock.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum item critico no momento.</p>
          ) : (
            <div className="space-y-2">
              {criticalStock.map(product => (
                <div key={product.id} className="flex justify-between items-center rounded-lg border border-gray-200 px-3 py-2">
                  <span className="text-sm font-semibold text-[#1B3A5C]">{product.name}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {product.stock} un.
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Top Produtos" subtitle="Mais vendidos hoje">
          {isLoading ? (
            <SkeletonCard variant="product" count={3} />
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">Sem vendas no periodo para calcular ranking.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((item, index) => {
                const barWidth = Math.max(12, Math.round((item.totalQuantity / topProducts[0].totalQuantity) * 100));
                return (
                  <div key={`${item.productName}-${index}`} className="rounded-lg border border-gray-200 px-3 py-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-[#1B3A5C]">{item.productName}</span>
                      <span className="text-xs font-bold text-gray-600">{item.totalQuantity}x</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-[#1B3A5C] rounded-full" style={{ width: `${barWidth}%` }} />
                    </div>
                    <p className="text-xs text-gray-500">{formatBRL(item.totalRevenue)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="space-y-3">
          <Button variant="danger" onClick={() => navigate('/sales/new')}>
            Nova Venda
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => navigate('/customers')}>Clientes</Button>
            <Button variant="outline" onClick={() => navigate('/products')}>Produtos</Button>
            <Button variant="outline" onClick={() => navigate('/payments')}>Pagamentos</Button>
            <Button variant="outline" onClick={() => navigate('/reports')}>Relatorios</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HomePage;
