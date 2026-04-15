import React, { useEffect, useState } from 'react';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import ModalConfirm from '../components/UI/ModalConfirm';
import { Customer } from '../types';
import { customerService } from '../services/customerService';
import { normalizePhone, isValidPhone, formatPhoneDisplay } from '../utils/phone';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const list = await customerService.getAll();
    setCustomers(list);
  };

  const handleSave = async () => {
    if (!name || !isValidPhone(phone)) {
      setAlert({ type: 'error', msg: 'Preencha nome e telefone validos.' });
      return;
    }

    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, { name });
        setAlert({ type: 'success', msg: 'Cliente atualizado com sucesso.' });
      } else {
        const existing = await customerService.getByPhone(phone);
        if (existing) {
          setAlert({ type: 'error', msg: 'Este telefone ja esta cadastrado.' });
          return;
        }
        await customerService.create({ name, phone });
        setAlert({ type: 'success', msg: 'Cliente cadastrado com sucesso.' });
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

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    await customerService.remove(customerToDelete);
    setAlert({ type: 'success', msg: 'Cliente removido.' });
    setIsModalOpen(false);
    setCustomerToDelete(null);
    loadCustomers();
  };

  return (
    <div className="space-y-4 pb-10">
      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <Card title={editingCustomer ? 'Editar Cliente' : 'Adicionar Cliente'}>
        <Input label="Nome" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Joao da Silva" />
        <Input
          label="Telefone"
          value={phone}
          onChange={e => setPhone(normalizePhone(e.target.value))}
          placeholder="55DDDNUMERO"
          disabled={!!editingCustomer}
          maxLength={13}
        />
        <div className="flex gap-3">
          <Button variant="success" onClick={handleSave}>Salvar Cliente</Button>
          {editingCustomer && <Button variant="secondary" onClick={resetForm}>Cancelar</Button>}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sortedCustomers.map(customer => (
          <Card key={customer.id} className="!mb-0">
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <h3 className="font-bold text-[#1e4d72] text-base leading-tight">{customer.name}</h3>
                <p className="text-sm text-[#28a745] font-semibold mt-1">{formatPhoneDisplay(customer.phone)}</p>
              </div>
              <div className="mt-auto flex gap-2">
                <Button
                  variant="outline"
                  className="!px-3 !py-2 text-lg"
                  onClick={() => handleEdit(customer)}
                  aria-label="Editar cliente"
                  title="Editar"
                >
                  ✏️
                </Button>
                <Button
                  variant="danger"
                  className="!px-3 !py-2 text-lg"
                  onClick={() => {
                    setCustomerToDelete(customer.id);
                    setIsModalOpen(true);
                  }}
                  aria-label="Excluir cliente"
                  title="Excluir"
                >
                  🗑️
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ModalConfirm
        isOpen={isModalOpen}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente?"
        onConfirm={confirmDelete}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default CustomersPage;
