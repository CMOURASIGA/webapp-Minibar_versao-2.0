
import React from 'react';
import Header from './Header';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e4d72] via-[#2d5f8a] to-[#3a6f9a] py-6 px-4">
      <div className="max-w-[420px] mx-auto">
        <Header />
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
