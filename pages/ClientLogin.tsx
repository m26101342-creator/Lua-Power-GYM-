import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ArrowRight, AlertCircle, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { UserRole, UserStatus, User, GymClass } from '../types';
import { Check } from 'lucide-react';

export const ClientLogin: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<GymClass[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchClasses = async () => {
      const classes = await getDocs(collection(db, 'classes'));
      setAvailableClasses(classes.docs.map(doc => ({ id: doc.id, ...doc.data() } as GymClass)));
    };
    fetchClasses();
  }, []);

  const toggleClass = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (isRegistering && !name)) {
        setError('Por favor, preencha todos os campos.');
        return;
    }

    setLoading(true);
    try {
        if (isRegistering) {
            // Register
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Create user document in Firestore
            const newUser: User = {
                id: user.uid,
                name,
                email,
                role: UserRole.STUDENT,
                status: UserStatus.PENDING_PAYMENT,
                enrolled_classes: selectedClasses,
                qr_code_hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                createdAt: new Date().toISOString()
            };
            
            await setDoc(doc(db, 'users', user.uid), newUser);
            localStorage.setItem('gym_client_id', user.uid);
            navigate('/');
        } else {
            // Login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Verify if user exists in Firestore and is a student
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                if (userData.role === UserRole.STUDENT) {
                    localStorage.setItem('gym_client_id', user.uid);
                    navigate('/');
                } else {
                    setError('Esta conta não é de aluno.');
                    auth.signOut();
                }
            } else {
                setError('Conta não encontrada.');
                auth.signOut();
            }
        }
    } catch (err: any) {
        console.error("Auth error:", err);
        if (err.code === 'auth/email-already-in-use') {
            setError('Este email já está em uso.');
        } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            setError('Email ou senha incorretos.');
        } else if (err.code === 'auth/weak-password') {
            setError('A senha deve ter pelo menos 6 caracteres.');
        } else if (err.code === 'auth/operation-not-allowed') {
            setError('O login com Email/Senha não está ativado no Console do Firebase.');
        } else {
            setError('Erro de conexão. Tente novamente.');
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <Layout hideHeader>
      <div className="min-h-full flex flex-col justify-center px-6 pt-10 pb-10">
        <div className="flex flex-col items-center mb-8 animate-fade-in">
            <img src="https://i.postimg.cc/K86FS7PH/1000196294_fotor_enhance_20260107104529.jpg" alt="Lua Power GYM" className="w-24 h-24 rounded-[2rem] object-cover mb-6 shadow-xl shadow-emerald-600/20 rotate-3"/>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center">LUA POWER <span className="text-emerald-600">GYM</span></h1>
            <p className="text-slate-400 font-medium mt-2">App do Aluno</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {isRegistering ? 'Criar nova conta' : 'Acesse sua conta'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Seu Nome</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className={`w-5 h-5 transition-colors ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-emerald-500'}`} />
                    </div>
                    <input type="text" className={`w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl shadow-inner placeholder:text-slate-300 transition-all font-medium border-2 text-lg ${error ? 'border-rose-300 text-rose-900 focus:ring-rose-200 focus:border-rose-400 focus:ring-4 bg-rose-50' : 'border-transparent text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50'} focus:outline-none`} placeholder="João Silva" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} />
                  </div>
                </div>
            )}
            
            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Seu Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`w-5 h-5 transition-colors ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-emerald-500'}`} />
                </div>
                <input type="email" className={`w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl shadow-inner placeholder:text-slate-300 transition-all font-medium border-2 text-lg ${error ? 'border-rose-300 text-rose-900 focus:ring-rose-200 focus:border-rose-400 focus:ring-4 bg-rose-50' : 'border-transparent text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50'} focus:outline-none`} placeholder="seu@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Sua Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`w-5 h-5 transition-colors ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-emerald-500'}`} />
                </div>
                <input type="password" className={`w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl shadow-inner placeholder:text-slate-300 transition-all font-medium border-2 text-lg ${error ? 'border-rose-300 text-rose-900 focus:ring-rose-200 focus:border-rose-400 focus:ring-4 bg-rose-50' : 'border-transparent text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50'} focus:outline-none`} placeholder="••••••" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
              </div>
            </div>

            {isRegistering && (
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Escolha suas Aulas</label>
                  <div className="grid grid-cols-1 gap-2">
                    {availableClasses.map(cls => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => toggleClass(cls.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedClasses.includes(cls.id) ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-transparent text-slate-600'}`}
                      >
                        <span className="font-bold">{cls.name}</span>
                        {selectedClasses.includes(cls.id) && <Check className="w-5 h-5 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
            )}

            {error && (
              <div className="flex items-center gap-2 mt-3 text-rose-500 animate-fade-in bg-rose-50 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /><p className="text-xs font-bold leading-tight">{error}</p>
              </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 transition-all duration-300 flex items-center justify-center gap-3 text-lg disabled:opacity-70 disabled:cursor-not-allowed mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isRegistering ? 'Criar Conta' : 'Entrar'} <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem conta? Registe-se'}
            </button>
          </div>
        </div>
        <div className="mt-8 text-center">
            <button onClick={() => navigate('/admin-login')} className="text-xs font-bold text-slate-300 hover:text-emerald-600 transition-colors uppercase tracking-widest">Sou Administrador</button>
        </div>
      </div>
    </Layout>
  );
};