import React, { useEffect, useState } from 'react';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import StepWizard from '../components/UI/StepWizard';
import SkeletonCard from '../components/UI/SkeletonCard';
import ProductCard from '../components/products/ProductCard';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { salesService } from '../services/salesService';
import { Product } from '../types';
import { normalizePhone, isValidPhone } from '../utils/phone';
import { formatBRL } from '../utils/currency';
import { generateRequestId } from '../utils/id';

const RegisterSalePage: React.FC = () => {
  const { items, customerPhone, customerName, setCustomerInfo, addItem, removeItem, clearCart, total } = useCart();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [phone, setPhone] = useState(customerPhone);
  const [step, setStep] = useState(0);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  useEffect(() => {
    const load = async () => {
      setIsLoadingProducts(true);
      try {
        const data = await productService.getAll();
        setProducts(data);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    load();
  }, []);

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = normalizePhone(e.target.value);
    setPhone(val);

    if (isValidPhone(val)) {
      const customer = await customerService.getByPhone(val);
      if (customer) {
        setCustomerInfo(val, customer.name);
        setAlert({ type: 'success', msg: `Cliente encontrado: ${customer.name}` });
      } else {
        setCustomerInfo(val, '');
        setAlert({ type: 'error', msg: 'Cliente nao encontrado. Verifique o cadastro.' });
      }
    } else {
      setCustomerInfo(val, '');
      if (val.length === 13) setAlert({ type: 'error', msg: 'Telefone invalido.' });
    }
  };

  const handleAddToCart = (product: Product) => {
    const error = addItem(product, 1);
    if (error) {
      setAlert({ type: 'error', msg: error });
    } else {
      showToast({ type: 'success', message: `${product.name} adicionado ao carrinho` });
    }
  };

  const canContinueFromCustomer = isValidPhone(phone) && !!customerName;
  const canContinueFromItems = items.length > 0;
  const canAdvance = step === 0 ? canContinueFromCustomer : step === 1 ? canContinueFromItems : items.length > 0;

  const handleFinalize = async () => {
    if (!isValidPhone(phone) || !customerName || items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await salesService.registerSale({
        customerPhone: phone,
        customerName,
        items,
        status: 'Pending',
        requestId: generateRequestId()
      });

      showToast({ type: 'success', message: 'Pedido confirmado com sucesso!' });
      setAlert({ type: 'success', msg: 'Pedido confirmado. Pagamento sera finalizado na tela de pagamentos.' });
      clearCart();
      setPhone('');
      setStep(0);
    } catch (e) {
      setAlert({ type: 'error', msg: 'Erro ao registrar compra.' });
      showToast({ type: 'error', message: 'Falha ao registrar compra' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <StepWizard
        steps={['Cliente', 'Itens', 'Finalizar']}
        currentStep={step}
        onStepClick={index => setStep(index)}
      />

      <div className="sticky top-2 z-30 bg-[#F4F6F9] pb-1">
        <div className="rounded-xl border border-gray-200 bg-white p-2 flex gap-2 justify-between">
          <Button
            variant="outline"
            fullWidth={false}
            className="!py-2 !px-3 text-xs"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || isSubmitting}
          >
            Voltar
          </Button>

          {step < 2 ? (
            <Button
              fullWidth={false}
              className="!py-2 !px-3 text-xs"
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance}
            >
              Proximo
            </Button>
          ) : (
            <Button
              variant="success"
              fullWidth={false}
              className="!py-2 !px-3 text-xs"
              onClick={handleFinalize}
              disabled={!canAdvance || isSubmitting}
              isLoading={isSubmitting}
            >
              Confirmar Pedido
            </Button>
          )}
        </div>
      </div>

      {step === 0 && (
        <Card title="Cliente">
          <Input
            label="Telefone (DDI + DDD + Numero)"
            type="tel"
            placeholder="Ex: 5511999999999"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={13}
          />
          <Input label="Nome do Cliente" value={customerName} readOnly disabled className="bg-gray-100" />
          <Button onClick={() => setStep(1)} disabled={!canContinueFromCustomer}>
            Continuar
          </Button>
        </Card>
      )}

      {step === 1 && (
        <>
          <Card title="Itens da Venda" subtitle="Toque para adicionar produto ao carrinho">
            {isLoadingProducts ? (
              <SkeletonCard variant="product" count={4} />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {sortedProducts.map(product => {
                  const current = items.find(item => item.productId === product.id)?.quantity || 0;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={current}
                      onAdd={() => handleAddToCart(product)}
                      onRemove={() => removeItem(product.id)}
                      disabled={product.stock <= 0}
                    />
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {step === 2 && (
        <>
          <Card title="Confirmacao do Pedido" subtitle="Nesta etapa voce confirma os itens solicitados.">
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div>
                    <h4 className="font-bold text-[#1e4d72]">{item.productName}</h4>
                    <p className="text-xs text-gray-500">
                      Qtd: {item.quantity} x {formatBRL(item.price)} = {formatBRL(item.price * item.quantity)}
                    </p>
                  </div>
                  <button className="text-red-500 font-bold p-2" onClick={() => removeItem(item.productId)}>
                    X
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-4 pt-3 border-t border-gray-200">
              <span className="font-bold text-gray-700">Total:</span>
              <span className="text-xl font-bold text-[#28a745]">{formatBRL(total)}</span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar aos itens
              </Button>
              <Button variant="success" onClick={handleFinalize} isLoading={isSubmitting}>
                Confirmar Pedido
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default RegisterSalePage;
