import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const AdminLogin: React.FC = () => {
  const [error, setError] = useState<string | boolean>(false);
  const [validating, setValidating] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidating(true);
    setError(false);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        sessionStorage.setItem('isAdmin', 'true');
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error("Auth error", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login com Google não está ativado no Console do Firebase.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setValidating(false);
    }
  };

  return (
    <Layout hideHeader>
      <div className="min-h-full flex flex-col justify-center px-6 pt-20">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm text-emerald-600">
           <ShieldCheck className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 text-center mb-2">Área do Gestor</h1>
        <p className="text-slate-500 text-center mb-10">Faça login com sua conta Google para continuar.</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <button type="submit" disabled={validating} className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 transition-all duration-300 flex items-center justify-center gap-3 text-lg">
            {validating ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar com Google <ArrowRight className="w-5 h-5" /></>}
          </button>
          {error && <p className="mt-2 ml-1 text-sm text-rose-500 font-medium animate-fade-in text-center">{typeof error === 'string' ? error : 'Erro ao fazer login. Tente novamente.'}</p>}
        </form>

        <button onClick={() => navigate('/')} className="mt-8 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors text-center">
          Voltar para Início
        </button>
      </div>
    </Layout>
  );
};
