import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LOGO_URL } from '../../constants';
import { loadJSON, saveJSON } from '../../utils/localStorage';

type NavItem = {
  label: string;
  icon: string;
  to: string;
  isPrimary?: boolean;
  isBottom?: boolean;
};

const STORAGE_KEY = 'minibar_sidebar_collapsed';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => loadJSON<boolean>(STORAGE_KEY, false));

  const items = useMemo<NavItem[]>(
    () => [
      { label: 'Inicio', icon: '🏠', to: '/' },
      { label: 'Nova Venda', icon: '🛒', to: '/sales/new', isPrimary: true },
      { label: 'Clientes', icon: '👥', to: '/customers' },
      { label: 'Produtos', icon: '📦', to: '/products' },
      { label: 'Historico', icon: '📋', to: '/history' },
      { label: 'Pagamentos', icon: '💰', to: '/payments' },
      { label: 'Relatorios', icon: '📊', to: '/reports' },
      { label: 'Configuracoes', icon: '⚙', to: '/settings', isBottom: true }
    ],
    []
  );

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    saveJSON(STORAGE_KEY, next);
  };

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <aside
      className={`bg-[#1B3A5C] text-white flex flex-col transition-all duration-200 ${
        collapsed ? 'w-[52px]' : 'w-[220px]'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
          <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
        </div>
        {!collapsed && <span className="text-sm font-semibold tracking-wide">Minibar</span>}
      </div>

      <div className="px-2">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center text-xs text-white/70 hover:text-white py-2"
        >
          {collapsed ? '>' : '<'}
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2">
        {items.filter(i => !i.isBottom).map(item => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                active ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className={`${item.isPrimary ? 'text-[#E8431A]' : ''}`}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-4">
        {items.filter(i => i.isBottom).map(item => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                active ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
