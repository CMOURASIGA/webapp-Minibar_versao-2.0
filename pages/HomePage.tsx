
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <Button onClick={() => navigate('/sales/new')}>
          <span className="text-xl">🛒</span> Registrar Compra
        </Button>
        <Button onClick={() => navigate('/history')}>
          <span className="text-xl">📊</span> Consultar Histórico
        </Button>
        <Button variant="carmim" onClick={() => navigate('/customers')}>
          <span className="text-xl">👤</span> Gerenciar Clientes
        </Button>
        <Button onClick={() => navigate('/products')}>
          <span className="text-xl">🔧</span> Gerenciar Produtos
        </Button>
        <Button onClick={() => navigate('/reports')}>
          <span className="text-xl">📈</span> Relatórios de Vendas
        </Button>
      </div>
    </Card>
  );
};

export default HomePage;
