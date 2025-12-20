import React, { useState } from 'react';
import { CreditCard, DollarSign, Calendar, FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

export interface PaymentData {
  method: string;
  amount: number;
  date: string;
  notes?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: PaymentData) => void;
  totalAmount: number;
  isLoading?: boolean;
}

const paymentMethods = [
  { value: 'dinheiro', label: '💵 Dinheiro' },
  { value: 'pix', label: '📱 PIX' },
  { value: 'cartao_credito', label: '💳 Cartão de Crédito' },
  { value: 'cartao_debito', label: '💳 Cartão de Débito' },
  { value: 'transferencia', label: '🏦 Transferência Bancária' },
  { value: 'boleto', label: '📄 Boleto' },
  { value: 'cheque', label: '📝 Cheque' },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  isLoading = false,
}) => {
  const [method, setMethod] = useState('pix');
  const [amount, setAmount] = useState(totalAmount);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ method, amount, date, notes });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Registrar Pagamento" 
      titleIcon={<CreditCard className="text-green-600" size={20} />}
      size="md"
      headerClassName="bg-green-50"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs text-green-600 font-bold uppercase mb-1">Valor Total da OS</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalAmount)}</p>
        </div>

        <Select
          label="Forma de Pagamento"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          options={paymentMethods}
        />

        <Input
          label="Valor Pago"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          icon={<DollarSign size={18} />}
        />

        <Input
          label="Data do Pagamento"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          icon={<Calendar size={18} />}
        />

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            <FileText size={14} className="inline mr-1" />
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre o pagamento..."
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1" disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="success" className="flex-1" isLoading={isLoading}>
            <CreditCard size={16} />
            Confirmar Pagamento
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;
