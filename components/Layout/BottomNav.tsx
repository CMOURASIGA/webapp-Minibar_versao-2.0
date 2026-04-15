import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

type NavItem = {
  label: string;
  icon: string;
  to?: string;
  isMore?: boolean;
};

const MORE_ROUTES = ['/history', '/payments', '/reports', '/settings'];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  const items = useMemo<NavItem[]>(
    () => [
      { label: 'Inicio', icon: '🏠', to: '/' },
      { label: 'Vender', icon: '🛒', to: '/sales/new' },
      { label: 'Clientes', icon: '👥', to: '/customers' },
      { label: 'Produtos', icon: '📦', to: '/products' },
      { label: 'Mais', icon: '···', isMore: true }
    ],
    []
  );

  const isActive = (to?: string, isMore?: boolean) => {
    if (isMore) return MORE_ROUTES.some(route => location.pathname.startsWith(route));
    if (!to) return false;
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-14">
          {items.map(item => {
            const active = isActive(item.to, item.isMore);
            return item.isMore ? (
              <button
                key={item.label}
                className="flex-1 flex flex-col items-center justify-center gap-1"
                onClick={() => setIsMoreOpen(true)}
              >
                {active && <span className="w-1 h-1 rounded-full bg-[#E8431A]" />}
                <span className="text-sm leading-none">{item.icon}</span>
                <span className={`text-[9px] ${active ? 'text-[#E8431A] font-semibold' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.to as string}
                className="flex-1 flex flex-col items-center justify-center gap-1"
              >
                {active && <span className="w-1 h-1 rounded-full bg-[#E8431A]" />}
                <span className="text-sm leading-none">{item.icon}</span>
                <span className={`text-[9px] ${active ? 'text-[#E8431A] font-semibold' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {isMoreOpen && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/30">
          <div className="w-full rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#1B3A5C]">Mais opcoes</h3>
              <button className="text-xs text-gray-500" onClick={() => setIsMoreOpen(false)}>
                Fechar
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Link to="/history" className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm">
                <span className="flex items-center gap-2">📋 Historico</span>
                <span className="text-gray-400">{'>'}</span>
              </Link>
              <Link to="/payments" className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm">
                <span className="flex items-center gap-2">💰 Pagamentos</span>
                <span className="text-gray-400">{'>'}</span>
              </Link>
              <Link to="/reports" className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm">
                <span className="flex items-center gap-2">📊 Relatorios</span>
                <span className="text-gray-400">{'>'}</span>
              </Link>
              <Link to="/settings" className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm">
                <span className="flex items-center gap-2">⚙ Configuracoes</span>
                <span className="text-gray-400">{'>'}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
