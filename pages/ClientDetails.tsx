import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getUserById, deleteUser, saveUser } from '../services/userService';
import { generateClientPDF } from '../services/pdfService';
import { User, UserStatus, GymClass } from '../types';
import { getUserStatus, formatDate, calculateExpiryDate } from '../utils/dateUtils';
import { getClasses } from '../services/classService';
import { Trash2, RefreshCw, MessageCircle, Calendar, Phone, CheckCircle2, AlertTriangle, XCircle, FileText, Download, Pencil, Banknote, Dumbbell, Info } from 'lucide-react';
import { GymLoading } from '../components/GymLoading';

export const ClientDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [enrolledClassesData, setEnrolledClassesData] = useState<GymClass[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const [_, setTick] = useState(0);

  useEffect(() => {
    const fetchClient = async () => {
        if (id) {
          const found = await getUserById(id);
          if (found) {
              setClient(found);
              
              // Fetch classes data
              const allClasses = await getClasses();
              const enrolled = allClasses.filter(c => found.enrolled_classes?.includes(c.id));
              setEnrolledClassesData(enrolled);
              
              const amount = enrolled.reduce((acc, c) => acc + c.price, 0);
              setTotalAmount(amount);
          } else {
              navigate('/');
          }
          setLoading(false);
        }
    };
    fetchClient();
  }, [id, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (loading) {
      return (
          <Layout title="Carregando...">
              <GymLoading />
          </Layout>
      );
  }

  if (!client) return null;

  const statusData = getUserStatus(client);
  const duration = client.durationDays || 30;
  const isExpired = statusData.status === UserStatus.EXPIRED;
  
  const formattedAmount = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(totalAmount);

  const getStatusConfig = () => {
    switch (statusData.status) {
      case UserStatus.ACTIVE: 
        return { 
          icon: <CheckCircle2 className="w-5 h-5" />, 
          bg: 'bg-emerald-50', 
          text: 'text-emerald-700', 
          border: 'border-emerald-100',
          gradient: 'from-emerald-500 to-teal-500'
        };
      case UserStatus.WARNING: 
        return { 
          icon: <AlertTriangle className="w-5 h-5" />, 
          bg: 'bg-amber-50', 
          text: 'text-amber-700', 
          border: 'border-amber-100',
          gradient: 'from-amber-500 to-orange-500'
        };
      case UserStatus.EXPIRED: 
        return { 
          icon: <XCircle className="w-5 h-5" />, 
          bg: 'bg-rose-50', 
          text: 'text-rose-700', 
          border: 'border-rose-100',
          gradient: 'from-rose-500 to-red-500'
        };
      case UserStatus.PENDING_PAYMENT: 
        return { 
          icon: <AlertTriangle className="w-5 h-5" />, 
          bg: 'bg-blue-50', 
          text: 'text-blue-700', 
          border: 'border-blue-100',
          gradient: 'from-blue-500 to-indigo-500'
        };
      default:
        return { 
          icon: <Info className="w-5 h-5" />, 
          bg: 'bg-slate-50', 
          text: 'text-slate-700', 
          border: 'border-slate-100',
          gradient: 'from-slate-500 to-gray-500'
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleBack = () => {
    if (sessionStorage.getItem('isAdmin')) {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleDelete = async () => {
    if (client.id) {
        await deleteUser(client.id);
        setShowDeleteModal(false);
        if (sessionStorage.getItem('isAdmin')) {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
    }
  };

  const handleRenew = async () => {
    let newStartDate: string;
    let newExpiryDate: string;
    
    const today = new Date().toISOString().split('T')[0];

    if (isExpired) {
        newStartDate = today;
        newExpiryDate = calculateExpiryDate(today, duration);
    } else {
        newExpiryDate = calculateExpiryDate(client.subscription_end_date, duration);
        newStartDate = client.subscription_start_date; 
    }
    
    const updatedClient = {
      ...client,
      subscription_start_date: newStartDate,
      subscription_end_date: newExpiryDate,
    };

    await saveUser(updatedClient);
    setClient(updatedClient);
    setShowRenewModal(false);
    setToastMessage("Plano renovado com sucesso!");
  };

  const confirmDownloadPDF = async () => {
    setToastMessage("Gerando PDF...");
    await generateClientPDF(client, enrolledClassesData);
    setShowDownloadModal(false);
    setToastMessage("PDF baixado com sucesso!");
  };

  const handleWhatsApp = () => {
    const expiryDate = formatDate(client.subscription_end_date);
    let message = '';
    
    if (statusData.status === UserStatus.EXPIRED) {
      message = `⚠️ Plano expirado\nO teu acesso ao ginásio Lua Power GYM terminou em ${expiryDate}.\nResultados não se perdem, pausas sim.\nRenova e volta ao treino 🔁💪`;
    } else if (statusData.status === UserStatus.WARNING) {
      message = `⏰ Atenção!\nO teu plano no ginásio Lua Power GYM está prestes a expirar.\n📅 Vence em: ${expiryDate}\nNão pares agora. Renova e mantém os resultados 💥`;
    } else {
      message = `💪 Bem-vindo(a) ao ginásio Lua Power GYM!\nA tua matrícula foi confirmada com sucesso.\n📅 Plano ativo até: ${expiryDate}\nAgora é foco, disciplina e consistência.\nConta connosco. Vamos treinar! 🔥`;
    }
    
    const url = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Layout title="Detalhes" showBack onBack={handleBack} notification={toastMessage}>
      <div className="space-y-6 mt-2 relative pb-20">
        
        {/* Header */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden text-center group">
           <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-br ${statusConfig.gradient} opacity-10`} />
           
           <div className="relative">
             <div className="w-24 h-24 mx-auto bg-white rounded-full p-1 shadow-lg mb-4 flex items-center justify-center">
                {client.avatar ? (
                  <img src={client.avatar} alt={client.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className={`w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-600`}>
                    {client.name.charAt(0)}
                  </div>
                )}
             </div>
             
             <h2 className="text-2xl font-bold text-slate-800 mb-1">{client.name}</h2>
             
             <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} text-sm font-bold mt-2 shadow-sm`}>
               {statusConfig.icon}
               <span className="tabular-nums">{statusData.label} • {statusData.timeString}</span>
             </div>
           </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-slate-50 p-3 rounded-xl text-slate-500">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">WhatsApp</p>
              <p className="text-slate-800 font-semibold text-lg">{client.phone}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center gap-1">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                 <Calendar className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase tracking-wider">Vencimento</span>
              </div>
              <p className="text-slate-800 font-semibold text-lg">{formatDate(client.subscription_end_date)}</p>
            </div>

            <div className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center gap-1">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                 <Banknote className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase tracking-wider">Valor</span>
              </div>
              <p className="text-slate-800 font-semibold text-lg">{formattedAmount}</p>
            </div>
          </div>
        </div>
        
        {/* Enrolled Classes List */}
        {enrolledClassesData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Modalidades Inscritas</h3>
             </div>
             <div className="space-y-3">
               {enrolledClassesData.map((cls, idx) => (
                 <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="font-semibold text-slate-800">{cls.name}</span>
                    <span className="text-sm font-bold text-emerald-600">
                       {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(cls.price)}
                    </span>
                 </div>
               ))}
               <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-400 text-xs uppercase">Total</span>
                  <span className="font-bold text-slate-900">{formattedAmount}</span>
               </div>
             </div>
          </div>
        )}

        {/* Notes */}
        {client.notes && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
             <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Observações</h3>
             </div>
             <p className="text-slate-600 text-sm leading-7 whitespace-pre-wrap font-medium">
               {client.notes}
             </p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 space-y-4">
          <button onClick={handleWhatsApp} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg">
            <MessageCircle className="w-6 h-6" /> Enviar Mensagem
          </button>

          <button onClick={() => setShowRenewModal(true)} className="w-full py-4 bg-white border border-blue-200 text-blue-600 font-bold rounded-2xl hover:bg-blue-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm">
              <RefreshCw className="w-5 h-5" /> Renovar Plano
          </button>
          
          <button onClick={() => setShowDownloadModal(true)} className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm">
            <FileText className="w-5 h-5" /> Baixar PDF
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <Link to={`/edit/${client.id}`} className="py-4 bg-white border border-slate-200 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                <Pencil className="w-5 h-5" /> Editar
            </Link>
             <button onClick={() => setShowDeleteModal(true)} className="py-4 bg-white border border-red-100 text-red-500/80 font-semibold rounded-2xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center justify-center gap-2 active:opacity-70">
                <Trash2 className="w-5 h-5" /> Excluir
              </button>
           </div>
        </div>
      </div>

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-all" onClick={() => setShowRenewModal(false)} />
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative z-10 animate-fade-in scale-100 origin-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 mx-auto">
               <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Renovar Plano?</h3>
            <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed">
              {isExpired ? (
                  <>O plano está vencido. Um novo ciclo de <span className="font-bold text-slate-700">{duration} dias</span> será iniciado hoje.</>
              ) : (
                  <>O plano está ativo. A validade será estendida em <span className="font-bold text-slate-700">{duration} dias</span> a partir do vencimento atual.</>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRenewModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all">Cancelar</button>
              <button onClick={handleRenew} className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* ... Other modals (Download, Delete) remain same ... */}
       {/* Download Modal */}
      {showDownloadModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-all" onClick={() => setShowDownloadModal(false)} />
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative z-10 animate-fade-in scale-100 origin-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 mx-auto">
               <Download className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Baixar Comprovante?</h3>
            <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed">
              O arquivo PDF do cliente <span className="font-bold text-slate-700">{client.name}</span> será salvo no seu dispositivo.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDownloadModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all">Cancelar</button>
              <button onClick={confirmDownloadPDF} className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all">Baixar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-all" onClick={() => setShowDeleteModal(false)} />
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative z-10 animate-fade-in">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 mx-auto">
               <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Excluir Cliente?</h3>
            <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed">
              Tem certeza? Todos os dados de <span className="font-bold text-slate-700">{client.name}</span> serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-95 transition-all">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};