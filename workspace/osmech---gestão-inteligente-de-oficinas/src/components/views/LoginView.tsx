import React, { useState } from 'react';
import { Eye, EyeOff, Loader, Wrench, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginView: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Preencha todos os campos');
      return;
    }

    try {
      await login({ email, password });
    } catch (err) {
      // Error já é tratado pelo contexto
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Wrench size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">OSMech</h1>
          <p className="text-blue-100">Gestão Inteligente de Oficinas</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 animate-fade-in">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{displayError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Entrando...
              </>
            ) : (
              'Entrar no Sistema'
            )}
          </button>

          <div className="text-center">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Esqueci minha senha
            </a>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            <strong>Demo:</strong> admin@osmech.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};
