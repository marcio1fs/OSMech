import React, { useState } from 'react';
import { Save, Building2, MapPin } from 'lucide-react';
import { CompanySettings } from '../../types';
import { formatCNPJ, formatPhone } from '../../utils/helpers';

interface SetupViewProps {
  onSave: (settings: CompanySettings) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onSave }) => {
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
    subtitle: '',
  });

  const handleUppercaseChange = (field: keyof CompanySettings) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({ ...settings, [field]: e.target.value.toUpperCase() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.name || !settings.address) {
      alert('Preencha ao menos o nome e endereço da empresa.');
      return;
    }
    onSave(settings);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
              <Building2 size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Bem-vindo ao OSMech</h1>
          <p className="text-blue-100">
            Vamos configurar os dados da sua oficina para começar.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Nome da Empresa / Oficina
              </label>
              <input
                required
                type="text"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
                placeholder="EX: AUTO CENTER SILVA"
                value={settings.name}
                onChange={handleUppercaseChange('name')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Slogan / Subtítulo (Opcional)
              </label>
              <input
                type="text"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-sm"
                placeholder="EX: ESPECIALIZADO EM IMPORTADOS"
                value={settings.subtitle || ''}
                onChange={handleUppercaseChange('subtitle')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                CNPJ
              </label>
              <input
                required
                type="text"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                placeholder="00.000.000/0000-00"
                value={settings.cnpj}
                onChange={(e) =>
                  setSettings({ ...settings, cnpj: formatCNPJ(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Telefone Comercial
              </label>
              <input
                required
                type="text"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="(00) 00000-0000"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: formatPhone(e.target.value) })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Endereço Completo
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  required
                  type="text"
                  className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-sm"
                  placeholder="RUA EXEMPLO, 123 - CENTRO, CIDADE - UF"
                  value={settings.address}
                  onChange={handleUppercaseChange('address')}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                E-mail de Contato (Opcional)
              </label>
              <input
                type="email"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm lowercase"
                placeholder="contato@suaoficina.com.br"
                value={settings.email || ''}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} /> Salvar Configurações e Iniciar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupView;
