
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import ModalConfirm from '../components/UI/ModalConfirm';
import { Customer } from '../types';
import { customerService } from '../services/customerService';
import { normalizePhone, isValidPhone, formatPhoneDisplay } from '../utils/phone';

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const list = await customerService.getAll();
    setCustomers(list);
  };

  const handleSave = async () => {
    if (!name || !isValidPhone(phone)) {
      setAlert({ type: 'error', msg: 'Preencha nome e telefone válidos.' });
      return;
    }

    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, { name });
        setAlert({ type: 'success', msg: 'Cliente atualizado com sucesso!' });
      } else {
        const existing = await customerService.getByPhone(phone);
        if (existing) {
          setAlert({ type: 'error', msg: 'Este telefone já está cadastrado.' });
          return;
        }
        await customerService.create({ name, phone });
        setAlert({ type: 'success', msg: 'Cliente cadastrado com sucesso!' });
      }
      resetForm();
      loadCustomers();
    } catch (e) {
      setAlert({ type: 'error', msg: 'Ocorreu um erro.' });
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEditingCustomer(null);
  };

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      await customerService.remove(customerToDelete);
      setAlert({ type: 'success', msg: 'Cliente removido.' });
      setIsModalOpen(false);
      setCustomerToDelete(null);
      loadCustomers();
    }
  };

  return (
    <div className="space-y-4 pb-10">
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

      <Card title={editingCustomer ? "✏️ Editar Cliente" : "👤 Adicionar Cliente"}>
        <Input 
          label="Nome" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Ex: João da Silva"
        />
        <Input 
          label="Telefone" 
          value={phone} 
          onChange={(e) => setPhone(normalizePhone(e.target.value))} 
          placeholder="55DDDNÚMERO"
          disabled={!!editingCustomer}
          maxLength={13}
        />
        <div className="flex gap-3">
          <Button variant="success" onClick={handleSave}>Salvar Cliente</Button>
          {editingCustomer && <Button variant="secondary" onClick={resetForm}>Cancelar</Button>}
        </div>
      </Card>

      <div className="space-y-3">
        {customers.map(c => (
          <Card key={c.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-[#1e4d72] text-lg">{c.name}</h3>
                <p className="text-sm text-[#28a745] font-semibold">{formatPhoneDisplay(c.phone)}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-blue-500 hover:bg-blue-50 rounded" onClick={() => handleEdit(c)}>✏️</button>
                <button className="p-2 text-red-500 hover:bg-red-50 rounded" onClick={() => handleDeleteClick(c.id)}>🗑️</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ModalConfirm 
        isOpen={isModalOpen} 
        title="Excluir Cliente" 
        message="Tem certeza que deseja excluir este cliente? Se ele tiver compras, isso pode gerar inconsistências."
        onConfirm={confirmDelete}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default CustomersPage;
