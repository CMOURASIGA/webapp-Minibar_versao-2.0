import React, { useEffect, useState } from 'react';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import Badge from '../components/UI/Badge';
import ModalConfirm from '../components/UI/ModalConfirm';
import { Product } from '../types';
import { productService } from '../services/productService';
import { formatBRL } from '../utils/currency';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [modalType, setModalType] = useState<'delete' | 'entry' | 'adjust' | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [modalValue, setModalValue] = useState('');
  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const list = await productService.getAll();
    setProducts(list);
  };

  const handleSave = async () => {
    if (!name || !price) {
      setAlert({ type: 'error', msg: 'Nome e preco sao obrigatorios.' });
      return;
    }

    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, { name, price: Number(price) });
        setAlert({ type: 'success', msg: 'Produto atualizado.' });
      } else {
        await productService.create({ name, price: Number(price), stock: Number(stock) || 0 });
        setAlert({ type: 'success', msg: 'Produto cadastrado.' });
      }
      resetForm();
      loadProducts();
    } catch (e) {
      setAlert({ type: 'error', msg: 'Erro ao salvar.' });
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setStock('');
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleModalAction = async () => {
    if (!selectedProductId) return;

    try {
      if (modalType === 'delete') {
        await productService.remove(selectedProductId);
        setAlert({ type: 'success', msg: 'Produto removido.' });
      } else if (modalType === 'entry') {
        await productService.registerEntry(selectedProductId, Number(modalValue));
        setAlert({ type: 'success', msg: 'Estoque adicionado.' });
      } else if (modalType === 'adjust') {
        await productService.adjustStock(selectedProductId, Number(modalValue));
        setAlert({ type: 'success', msg: 'Estoque ajustado.' });
      }

      setModalType(null);
      setSelectedProductId(null);
      setModalValue('');
      loadProducts();
    } catch (e) {
      setAlert({ type: 'error', msg: 'Ocorreu um erro.' });
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <Card title={editingProduct ? 'Editar Produto' : 'Adicionar Produto'}>
        <Input label="Nome" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Preco (R$)" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
        {!editingProduct && <Input label="Estoque Inicial" type="number" value={stock} onChange={e => setStock(e.target.value)} />}
        <div className="flex gap-3">
          <Button variant="success" onClick={handleSave}>Salvar Produto</Button>
          {editingProduct && <Button variant="secondary" onClick={resetForm}>Cancelar</Button>}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sortedProducts.map(product => (
          <Card key={product.id} className="!mb-0">
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <h3 className="font-bold text-[#1e4d72] text-base leading-tight">{product.name}</h3>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="text-gray-600 font-bold">{formatBRL(product.price)}</span>
                  <Badge variant={product.stock < 5 ? 'danger' : 'info'}>Estoque: {product.stock}</Badge>
                </div>
              </div>

              <div className="mt-auto space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="!px-2 !py-2 text-lg"
                    onClick={() => handleEdit(product)}
                    aria-label="Editar produto"
                    title="Editar"
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="danger"
                    className="!px-2 !py-2 text-lg"
                    onClick={() => {
                      setModalType('delete');
                      setSelectedProductId(product.id);
                    }}
                    aria-label="Excluir produto"
                    title="Excluir"
                  >
                    🗑️
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="!px-2 !py-2 text-lg"
                    onClick={() => {
                      setModalType('entry');
                      setSelectedProductId(product.id);
                    }}
                    aria-label="Entrada de estoque"
                    title="Entrada"
                  >
                    📥
                  </Button>
                  <Button
                    variant="outline"
                    className="!px-2 !py-2 text-lg"
                    onClick={() => {
                      setModalType('adjust');
                      setSelectedProductId(product.id);
                    }}
                    aria-label="Ajuste de estoque"
                    title="Ajuste"
                  >
                    🛠️
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ModalConfirm
        isOpen={modalType === 'delete'}
        title="Excluir Produto"
        message="Deseja realmente excluir este produto?"
        onConfirm={handleModalAction}
        onCancel={() => setModalType(null)}
      />

      {(modalType === 'entry' || modalType === 'adjust') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#1e4d72] mb-4">
              {modalType === 'entry' ? 'Entrada de Estoque' : 'Ajuste de Estoque'}
            </h3>
            <Input
              label={modalType === 'entry' ? 'Quantidade de Entrada' : 'Novo Saldo Total'}
              type="number"
              value={modalValue}
              onChange={e => setModalValue(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setModalType(null)}>Cancelar</Button>
              <Button variant="success" onClick={handleModalAction}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
