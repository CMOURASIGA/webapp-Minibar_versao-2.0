import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../../constants';
import { useViewport } from '../../hooks/useViewport';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import OfflineBanner from '../UI/OfflineBanner';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile, isDesktop } = useViewport();
  const location = useLocation();
  const navigate = useNavigate();

  const routeMeta = useMemo(() => {
    const map: Record<string, { title: string; subtitle?: string; showBack?: boolean }> = {
      '/': {
        title: APP_NAME,
        subtitle: new Date().toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'short'
        })
      },
      '/sales/new': { title: 'Nova Venda', showBack: true },
      '/customers': { title: 'Clientes', showBack: true },
      '/products': { title: 'Produtos', showBack: true },
      '/history': { title: 'Historico', showBack: true },
      '/payments': { title: 'Pagamentos', showBack: true },
      '/reports': { title: 'Relatorios', showBack: true },
      '/settings': { title: 'Configuracoes', showBack: true }
    };

    return map[location.pathname] || { title: APP_NAME };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#1a1a1a]">
      <div className="flex min-h-screen">
        {isDesktop && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <OfflineBanner />
          {isDesktop && <Topbar title={routeMeta.title} subtitle={routeMeta.subtitle} />}
          {isMobile && (
            <MobileHeader
              title={routeMeta.title}
              subtitle={routeMeta.subtitle}
              showBack={routeMeta.showBack}
              onBack={() => navigate(-1)}
              rightAction={
                location.pathname === '/' ? (
                  <button
                    className="w-8 h-8 rounded-lg bg-white/10 text-white text-sm flex items-center justify-center"
                    onClick={() => navigate('/settings')}
                    aria-label="Configuracoes"
                  >
                    ⚙
                  </button>
                ) : undefined
              }
            />
          )}
          <main
            className={`w-full ${isDesktop ? 'px-6 py-6' : 'px-4 pt-4 pb-24'} ${
              isDesktop ? 'max-w-[1200px] mx-auto' : ''
            }`}
          >
            {children}
          </main>
          {isMobile && <BottomNav />}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
