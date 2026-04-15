import React, { useEffect, useState } from 'react';

const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-100 text-amber-900 border-b border-amber-200 px-4 py-2 text-xs font-semibold text-center">
      Sem conexao com a internet. Os dados podem estar desatualizados.
    </div>
  );
};

export default OfflineBanner;
