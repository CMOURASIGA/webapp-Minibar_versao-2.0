
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import HomePage from './pages/HomePage';
import RegisterSalePage from './pages/RegisterSalePage';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import PurchaseHistoryPage from './pages/PurchaseHistoryPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import PaymentsPage from './pages/PaymentsPage';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/UI/Toast';

const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <CartProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/sales/new" element={<RegisterSalePage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/history" element={<PurchaseHistoryPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AppLayout>
          <Toast />
        </CartProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
