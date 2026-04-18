import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import ModalConfirm from '../components/UI/ModalConfirm';
import { Customer } from '../types';
import { customerService } from '../services/customerService';
import { formatPhoneDisplay, isValidPhone, normalizePhone } from '../utils/phone';
import { CUSTOMER_REGISTRATION_FORM_URL } from '../constants';

const AUTO_REFRESH_INTERVAL_MS = 8000;
const normalizeText = (value: string): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [nameFilterInput, setNameFilterInput] = useState('');
  const [phoneFilterInput, setPhoneFilterInput] = useState('');
  const [nameFilterApplied, setNameFilterApplied] = useState('');
  const [phoneFilterApplied, setPhoneFilterApplied] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const loadCustomers = useCallback(async (showErrorAlert = false) => {
    try {
      const list = await customerService.getAll();
      setCustomers(list);
    } catch (e) {
      if (showErrorAlert) {
        setAlert({ type: 'error', msg: 'Falha ao carregar clientes.' });
      }
    }
  }, []);

  useEffect(() => {
    loadCustomers(true);

    const intervalId = window.setInterval(() => {
      loadCustomers(false);
    }, AUTO_REFRESH_INTERVAL_MS);

    const onFocus = () => loadCustomers(false);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCustomers(false);
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadCustomers]);

  const openCustomerRegistrationForm = () => {
    window.open(CUSTOMER_REGISTRATION_FORM_URL, '_blank', 'noopener,noreferrer');
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setAlert({ type: 'error', msg: 'Informe o nome para atualizar.' });
      return;
    }

    const normalizedPhone = normalizePhone(editPhone);
    const hasPhone = normalizedPhone.length > 0;
    if (hasPhone && !isValidPhone(normalizedPhone)) {
      setAlert({ type: 'error', msg: 'Telefone invalido. Use 55 + DDD + numero.' });
      return;
    }

    try {
      await customerService.update(
        editingCustomer.id,
        { name: trimmedName, phone: hasPhone ? normalizedPhone : '' },
        editingCustomer.phone || ''
      );
      setAlert({ type: 'success', msg: 'Cliente atualizado com sucesso.' });
      setEditingCustomer(null);
      setEditName('');
      setEditPhone('');
      loadCustomers(false);
    } catch (e: any) {
      setAlert({ type: 'error', msg: e?.message || 'Ocorreu um erro.' });
    }
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    setEditName('');
    setEditPhone('');
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      await customerService.remove(customerToDelete);
      setAlert({ type: 'success', msg: 'Cliente removido.' });
      setIsModalOpen(false);
      setCustomerToDelete(null);
      loadCustomers(false);
    } catch (e) {
      setAlert({ type: 'error', msg: 'Falha ao remover cliente.' });
    }
  };

  const applyFilters = () => {
    setNameFilterApplied(nameFilterInput);
    setPhoneFilterApplied(phoneFilterInput);
  };

  const clearFilters = () => {
    setNameFilterInput('');
    setPhoneFilterInput('');
    setNameFilterApplied('');
    setPhoneFilterApplied('');
  };

  const filteredCustomers = useMemo(() => {
    const nameQuery = normalizeText(nameFilterApplied);
    const phoneQuery = phoneFilterApplied.replace(/\D/g, '');

    return [...customers]
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
      .filter(customer => {
        const customerName = normalizeText(customer.name);
        const customerPhone = (customer.phone || '').replace(/\D/g, '');
        const matchesName = !nameQuery || customerName.includes(nameQuery);
        const matchesPhone = !phoneQuery || customerPhone.includes(phoneQuery);
        return matchesName && matchesPhone;
      });
  }, [customers, nameFilterApplied, phoneFilterApplied]);

  return (
    <div className="space-y-4 pb-10">
      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <Card
        title="Clientes"
        subtitle="Novos clientes sao cadastrados no formulario oficial. A lista atualiza automaticamente."
      >
        <Input
          label="Nome (filtro)"
          value={nameFilterInput}
          onChange={e => setNameFilterInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') applyFilters();
          }}
          placeholder="Buscar por nome"
        />
        <Input
          label="Telefone (filtro)"
          value={phoneFilterInput}
          onChange={e => setPhoneFilterInput(e.target.value.replace(/\D/g, '').slice(0, 13))}
          onKeyDown={e => {
            if (e.key === 'Enter') applyFilters();
          }}
          placeholder="Buscar por telefone"
          maxLength={13}
        />
        <div className="flex gap-3 items-center flex-wrap">
          <Button variant="primary" fullWidth={false} onClick={applyFilters}>
            Pesquisar
          </Button>
          <Button variant="outline" fullWidth={false} onClick={clearFilters}>
            Limpar
          </Button>
          <Button variant="success" onClick={openCustomerRegistrationForm}>
            Abrir Formulario de Cadastro
          </Button>
          <span className="text-xs text-gray-500">Atualizacao automatica a cada {AUTO_REFRESH_INTERVAL_MS / 1000}s.</span>
        </div>
      </Card>

      {editingCustomer && (
        <Card title="Editar Cliente">
          <Input
            label="Nome"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="Ex: Joao da Silva"
          />
          <Input
            label="Telefone"
            value={editPhone}
            onChange={e => setEditPhone(normalizePhone(e.target.value))}
            placeholder="55DDDNUMERO"
            maxLength={13}
          />
          <div className="flex gap-3">
            <Button variant="success" onClick={handleSaveEdit}>Salvar Cliente</Button>
            <Button variant="secondary" onClick={cancelEdit}>Cancelar</Button>
          </div>
        </Card>
      )}

      {filteredCustomers.length === 0 && (
        <Card>
          <p className="text-sm text-gray-600">Nenhum cliente encontrado com os filtros informados.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredCustomers.map(customer => (
          <Card key={customer.id} className="!mb-0">
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <h3 className="font-bold text-[#1e4d72] text-base leading-tight">{customer.name}</h3>
                <p className={`text-sm font-semibold mt-1 ${customer.phone ? 'text-[#28a745]' : 'text-amber-600'}`}>
                  {customer.phone ? formatPhoneDisplay(customer.phone) : 'Sem telefone cadastrado'}
                </p>
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
