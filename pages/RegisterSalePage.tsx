
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import Badge from '../components/UI/Badge';
import { useCart } from '../context/CartContext';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { salesService } from '../services/salesService';
import { Product } from '../types';
import { normalizePhone, isValidPhone } from '../utils/phone';
import { formatBRL } from '../utils/currency';
import { generateRequestId } from '../utils/id';

const RegisterSalePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    items, customerPhone, customerName, setCustomerInfo, addItem, removeItem, clearCart, total 
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [phone, setPhone] = useState(customerPhone);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isPaid, setIsPaid] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    productService.getAll().then(setProducts);
  }, []);

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = normalizePhone(e.target.value);
    setPhone(val);
    
    if (isValidPhone(val)) {
      const customer = await customerService.getByPhone(val);
      if (customer) {
        setCustomerInfo(val, customer.name);
        setAlert({ type: 'success', msg: 'Cliente encontrado: ' + customer.name });
      } else {
        setCustomerInfo(val, '');
        setAlert({ type: 'error', msg: 'Cliente não encontrado. Verifique o cadastro.' });
      }
    } else {
      setCustomerInfo(val, '');
      if (val.length === 13) setAlert({ type: 'error', msg: 'Telefone inválido.' });
    }
  };

  const handleAddToCart = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const error = addItem(product, quantity);
    if (error) {
      setAlert({ type: 'error', msg: error });
    } else {
      setAlert({ type: 'success', msg: `${product.name} adicionado!` });
      setSelectedProductId('');
      setQuantity(1);
    }
  };

  const handleFinalize = async () => {
    if (!isValidPhone(phone) || !customerName || items.length === 0) return;

    setIsSubmitting(true);
    try {
      await salesService.registerSale({
        customerPhone: phone,
        customerName,
        items,
        status: isPaid ? 'Paid' : 'Pending',
        requestId: generateRequestId()
      });
      setAlert({ type: 'success', msg: 'Compra registrada com sucesso!' });
      clearCart();
      setTimeout(() => navigate('/'), 2000);
    } catch (e) {
      setAlert({ type: 'error', msg: 'Erro ao registrar compra.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-start mb-2">
        <Button 
          variant="secondary" 
          fullWidth={false} 
          className="py-1.5 px-4 text-sm" 
          onClick={() => navigate('/')}
        >
          ← Voltar
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}
      
      <Card title="🛒 Identificação">
        <Input 
          label="Telefone (DDI+DDD+NÚMERO)" 
          type="tel" 
          placeholder="Ex: 5511999999999"
          value={phone}
          onChange={handlePhoneChange}
          maxLength={13}
        />
        <Input label="Nome do Cliente" value={customerName} readOnly disabled className="bg-gray-100" />
      </Card>

      <Card title="📦 Produtos">
        <Select 
          label="Selecione o Produto"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          options={products.map(p => ({ 
            value: p.id, 
            label: `${p.name} (${formatBRL(p.price)}) - Est: ${p.stock}` 
          }))}
        />
        <Input 
          label="Quantidade" 
          type="number" 
          min={1} 
          value={quantity} 
          onChange={(e) => setQuantity(Number(e.target.value))} 
        />
        <Button variant="outline" onClick={handleAddToCart} disabled={!selectedProductId}>
          ➕ Adicionar ao Carrinho
        </Button>
      </Card>

      {items.length > 0 && (
        <Card title="🛒 Carrinho">
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.productId} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                <div>
                  <h4 className="font-bold text-[#1e4d72]">{item.productName}</h4>
                  <p className="text-xs text-gray-500">Qtd: {item.quantity} x {formatBRL(item.price)} = {formatBRL(item.price * item.quantity)}</p>
                </div>
                <button 
                  className="text-red-500 font-bold p-2" 
                  onClick={() => removeItem(item.productId)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-6 pt-3 border-t border-gray-200">
            <span className="font-bold text-gray-700">Total:</span>
            <span className="text-xl font-bold text-[#28a745]">{formatBRL(total)}</span>
          </div>

          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-100 rounded-xl">
            <input 
              type="checkbox" 
              id="isPaid" 
              checked={isPaid} 
              onChange={(e) => setIsPaid(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#1e4d72] focus:ring-[#1e4d72]"
            />
            <label htmlFor="isPaid" className="font-semibold text-[#1e4d72]">Marcar como Paga</label>
          </div>

          <Button variant="success" onClick={handleFinalize} isLoading={isSubmitting}>
            🛒 Finalizar Compra
          </Button>
        </Card>
      )}
    </div>
  );
};

export default RegisterSalePage;
