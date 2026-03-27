import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Dumbbell, CheckCircle2, Calendar, FileText, User as UserIcon, MessageCircle, Bell, Home, CreditCard, Lock, LogOut, ChevronRight, Clock, Shield, Wallet, AlertTriangle, XCircle, X, MapPin, Settings, Copy, Info, Phone, Building2, Swords, QrCode, Download, BookOpen, Droplets, CalendarCheck, Loader2, HelpCircle, Moon, Sun, ShieldCheck, Tags } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserById } from '../services/userService';
import { getClasses } from '../services/classService';
import { generateClientPDF } from '../services/pdfService';
import { getUserStatus, formatDate } from '../utils/dateUtils';
import { User, UserStatus, GymClass } from '../types';
import { PricingTable } from '../components/PricingTable';
import { db, auth } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Modal } from '../components/Modal';

import { SupportMessage, SupportMessageStatus, SupportMessageType } from '../types';
import { saveSupportMessage } from '../services/supportService';

const HomeTab: React.FC<{ client: User; changeTab: (tab: string) => void }> = ({ client, changeTab }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [globalNotifications, setGlobalNotifications] = useState<any[]>([]);
  const [supportMessage, setSupportMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const statusData = getUserStatus(client);
  
  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('is_global', '==', true),
      orderBy('created_at', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGlobalNotifications(msgs);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });
    
    return () => unsubscribe();
  }, []);

  let statusConfig = { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Em dia', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800' };
  if (statusData.status === UserStatus.PENDING_PAYMENT) {
    statusConfig = { icon: <AlertTriangle className="w-4 h-4" />, text: 'Pagamento Pendente', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' };
  } else if (statusData.status === UserStatus.EXPIRED) {
    statusConfig = { icon: <XCircle className="w-4 h-4" />, text: 'Expirado', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'border-rose-200 dark:border-rose-800' };
  }

  const notifications = [{ id: 1, title: "Seja bem-vindo(a)!", time: "Agora", icon: <Dumbbell className="w-5 h-5 text-slate-600 dark:text-slate-300" />, bg: "bg-slate-100 dark:bg-slate-700" }];
  if (statusData.status === UserStatus.PENDING_PAYMENT) {
    notifications.unshift({ id: 2, title: "Envie seu comprovativo", time: "Agora", icon: <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />, bg: "bg-blue-50 dark:bg-blue-900/20" });
  }

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    await generateClientPDF(client);
    setIsDownloading(false);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) return;
    setIsSending(true);
    
    const newMessage: SupportMessage = {
      id: crypto.randomUUID(),
      user_id: client.id,
      type: SupportMessageType.GENERAL_SUPPORT,
      content: supportMessage,
      status: SupportMessageStatus.UNREAD,
      created_at: new Date().toISOString()
    };

    try {
      await saveSupportMessage(newMessage);
      setSendSuccess(true);
      setSupportMessage('');
      setTimeout(() => {
        setSendSuccess(false);
        setActiveModal(null);
      }, 2000);
    } catch (error) {
      console.error("Error sending support message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const quickActions = [
    { icon: <QrCode className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />, label: "Carteirinha", action: () => setActiveModal('idCard') },
    { icon: <Download className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />, label: "Baixar Plano", action: handleDownloadPDF },
    { icon: <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />, label: "Regras", action: () => setActiveModal('rules') },
    { icon: <MessageCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />, label: "Suporte", action: () => setActiveModal('support') },
  ];

  return (
    <div className="animate-fade-in pb-32 max-w-lg mx-auto">
      <div className="px-6 pt-12 pb-6 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <img src="https://i.postimg.cc/K86FS7PH/1000196294_fotor_enhance_20260107104529.jpg" alt="Logo" className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100 dark:border-slate-700" />
             <div>
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">LUA POWER GYM</h2>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">Bem-vindo(a)</span>
             </div>
          </div>
          {client.avatar && (<img src={client.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-700 shadow-sm" alt="Profile" />)}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Olá, {client.name.split(' ')[0]}!</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Vamos treinar hoje?</p>
      </div>

      <div className="px-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-colors duration-300">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mensalidade</h2>
          <div className="flex items-center gap-2 mb-4">
            <div className={`rounded-full p-1.5 ${statusConfig.bg} ${statusConfig.color}`}>{statusConfig.icon}</div>
            <span className={`font-bold text-sm ${statusConfig.color}`}>{statusConfig.text}</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Próximo vencimento</p>
          <p className="text-slate-900 dark:text-white font-bold text-2xl mb-6 tracking-tight">{formatDate(client.subscription_end_date)}</p>
          <button onClick={() => changeTab('pagamentos')} className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] ${statusData.status === UserStatus.EXPIRED ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'}`}>{statusData.status === UserStatus.EXPIRED ? 'Renovar Plano' : 'Detalhes do Plano'}</button>
        </div>
      </div>

      {globalNotifications.length > 0 && (
        <div className="px-6 mb-8">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 ml-1">Comunicados</h3>
            <div className="space-y-3">
                {globalNotifications.map(notif => (
                    <div key={notif.id} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-2xl flex gap-3">
                        <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-200 leading-tight">{notif.message}</p>
                            <p className="text-[10px] text-amber-600/60 dark:text-amber-400/60 mt-1 font-medium">{formatDate(notif.created_at)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="px-6 mb-10">
        <div className="flex justify-between items-start gap-2">
          {quickActions.map((action, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 w-1/4">
              <button onClick={action.action} className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center active:bg-slate-50 dark:active:bg-slate-700 transition-colors">{action.icon}</button>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 text-center leading-tight max-w-[80px]">{action.label}</span>
            </div>
          ))}
        </div>
      </div>

      {(isDownloading || downloadSuccess) && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 flex flex-col items-center animate-fade-in max-w-[280px] w-full text-center">
              {isDownloading ? (
                <><div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4 relative"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Gerando PDF</h3><p className="text-xs text-slate-500 dark:text-slate-400">Aguarde um momento...</p></>
              ) : (
                <><div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" /></div><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Sucesso!</h3><p className="text-xs text-slate-500 dark:text-slate-400">O comprovativo foi baixado.</p></>
              )}
           </div>
        </div>
      )}

      {activeModal === 'idCard' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-0 w-full max-w-sm shadow-2xl relative z-10 animate-fade-in overflow-hidden">
             <div className="bg-gradient-to-br from-emerald-500 to-teal-600 h-32 relative">
                <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors"><X className="w-6 h-6" /></button>
                <div className="absolute -bottom-10 left-0 right-0 flex justify-center">
                    <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-lg">
                        {client.avatar ? <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-500">{client.name.charAt(0)}</div>}
                    </div>
                </div>
             </div>
             <div className="pt-12 pb-8 px-6 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{client.name}</h2>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider mb-6">Membro Oficial</p>
                <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-100 inline-block mb-6 relative">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${client.qr_code_hash}&color=0f172a`} alt="QR Code de Acesso" className="w-36 h-36 object-contain" />
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white px-2 py-0.5 rounded border border-slate-100 text-[10px] font-mono text-slate-400 shadow-sm">ID: {client.id.slice(0, 8)}</div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] mx-auto">Apresente este código na recepção para confirmar sua entrada.</p>
             </div>
             <div className="bg-slate-50 dark:bg-slate-700/50 py-3 px-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Validade</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(client.subscription_end_date)}</span>
             </div>
          </div>
        </div>
      )}
      
      {activeModal === 'rules' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative z-10 animate-fade-in flex flex-col max-h-[80vh]">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">Regras do Ginásio</h3>
               <button onClick={() => setActiveModal(null)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-slate-700"><X className="w-5 h-5" /></button>
             </div>
             <div className="overflow-y-auto space-y-4 pr-2">
               <p className="text-sm text-slate-600 dark:text-slate-300">1. Uso obrigatório de toalha em todos os aparelhos.</p>
               <p className="text-sm text-slate-600 dark:text-slate-300">2. Guarde os pesos e halteres após o uso.</p>
               <p className="text-sm text-slate-600 dark:text-slate-300">3. Respeite o espaço dos outros alunos.</p>
               <p className="text-sm text-slate-600 dark:text-slate-300">4. Limpe os equipamentos após o uso.</p>
               <p className="text-sm text-slate-600 dark:text-slate-300">5. Proibido a entrada sem check-in na recepção.</p>
             </div>
          </div>
        </div>
      )}

      {activeModal === 'support' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative z-10 animate-fade-in flex flex-col">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">Suporte</h3>
               <button onClick={() => setActiveModal(null)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-slate-700"><X className="w-5 h-5" /></button>
             </div>
             
             {sendSuccess ? (
               <div className="py-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Mensagem Enviada!</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nossa equipe responderá em breve.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 <p className="text-sm text-slate-600 dark:text-slate-300">Como podemos ajudar você hoje?</p>
                 <textarea 
                   className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                   rows={4}
                   placeholder="Digite sua mensagem aqui..."
                   value={supportMessage}
                   onChange={(e) => setSupportMessage(e.target.value)}
                 />
                 <button 
                   onClick={handleSendSupport}
                   disabled={isSending || !supportMessage.trim()}
                   className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                 >
                   {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Mensagem'}
                 </button>
                 
                 <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button 
                      onClick={() => window.open('https://wa.me/244921156899', '_blank')}
                      className="w-full py-3 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Falar pelo WhatsApp
                    </button>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

const ClassesTab: React.FC<{ client: User }> = ({ client }) => {
  const [selectedDateIdx, setSelectedDateIdx] = useState(0); 
  const [bookings, setBookings] = useState<string[]>([]);
  const [allClasses, setAllClasses] = useState<GymClass[]>([]);
  const [calendarDays, setCalendarDays] = useState<{ day: string, date: string, fullDate: Date, weekDayIdx: number }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`bookings_${client.id}`);
    if (saved) setBookings(JSON.parse(saved));
    getClasses().then(data => setAllClasses(data));
    const days = [];
    const weekMap = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({ day: weekMap[d.getDay()], date: d.getDate().toString().padStart(2, '0'), fullDate: d, weekDayIdx: d.getDay() });
    }
    setCalendarDays(days);
  }, [client.id]);

  const toggleBooking = (classId: string) => {
    let newBookings;
    if (bookings.includes(classId)) newBookings = bookings.filter(b => b !== classId);
    else newBookings = [...bookings, classId];
    setBookings(newBookings);
    localStorage.setItem(`bookings_${client.id}`, JSON.stringify(newBookings));
  };

  const selectedDayInfo = calendarDays[selectedDateIdx];
  const enrolledIds = client.enrolled_classes || [];
  const daysClasses = allClasses.filter(c => c.weekDays.includes(selectedDayInfo?.weekDayIdx)).filter(c => enrolledIds.includes(c.id)).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="animate-fade-in pb-32 h-full flex flex-col max-w-lg mx-auto">
      <div className="px-6 pt-12 pb-4 bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Agenda de Aulas</h1>
        <div className="flex justify-between gap-2 overflow-x-auto scrollbar-hide pb-2">
          {calendarDays.map((d, idx) => (
            <button key={idx} onClick={() => setSelectedDateIdx(idx)} className={`flex flex-col items-center justify-center min-w-[50px] h-[70px] rounded-2xl transition-all flex-shrink-0 ${selectedDateIdx === idx ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-110' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
              <span className="text-[10px] font-bold uppercase mb-1">{d.day}</span>
              <span className={`text-lg font-bold ${selectedDateIdx === idx ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{d.date}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{daysClasses.length > 0 ? 'Suas Aulas Disponíveis' : 'Agenda Vazia'}</p>
        {daysClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400"><Calendar className="w-8 h-8" /></div>
             <p className="text-slate-500 dark:text-slate-400 font-medium text-sm px-8">Nenhuma aula do seu plano agendada para hoje. Aproveite para descansar!</p>
          </div>
        ) : (
          daysClasses.map((item) => {
              const isBooked = bookings.includes(item.id);
              return (
                <div key={item.id} className={`p-5 rounded-2xl shadow-sm border flex items-center gap-4 transition-all ${isBooked ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                  <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl font-bold border ${isBooked ? 'bg-white dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-100 dark:border-slate-600'}`}>
                      <span className="text-lg">{item.startTime}</span>
                  </div>
                  <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
                      <div className="flex items-center gap-3 mt-1"><span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><UserIcon className="w-3 h-3" /> {item.instructor}</span><span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.duration}</span></div>
                  </div>
                  <button onClick={() => toggleBooking(item.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isBooked ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'}`}>{isBooked ? 'Confirmado' : 'Check-in'}</button>
                </div>
              );
          })
        )}
      </div>
    </div>
  );
};

const PaymentsTab: React.FC<{ client: User }> = ({ client }) => {
    const [totalAmount, setTotalAmount] = useState(0);
    
    useEffect(() => {
        const fetchAmount = async () => {
            if (!client.enrolled_classes || client.enrolled_classes.length === 0) return;
            const classes = await getClasses();
            const amount = client.enrolled_classes.reduce((acc, classId) => {
                const cls = classes.find(c => c.id === classId);
                return acc + (cls?.price || 0);
            }, 0);
            setTotalAmount(amount);
        };
        fetchAmount();
    }, [client.enrolled_classes]);

    const formattedAmount = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(totalAmount);
  return (
    <div className="animate-fade-in pb-32 h-full flex flex-col max-w-lg mx-auto">
       <div className="px-6 pt-12 pb-6 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-300"><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financeiro</h1></div>
      <div className="p-6 pt-2 overflow-y-auto">
        <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-6 text-white shadow-xl shadow-slate-900/20 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800 rounded-full blur-3xl translate-x-10 -translate-y-10 opacity-50"></div>
          <div className="relative z-10">
            <span className="text-slate-400 text-sm font-medium mb-1 block">Valor do Plano</span>
            <div className="flex items-baseline gap-1 mb-6"><span className="text-3xl font-bold">{formattedAmount.replace('Kz', '')}</span><span className="text-lg text-emerald-400 font-medium">Kz</span></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50"><Calendar className="w-4 h-4 text-emerald-400" /><span className="text-xs font-semibold tracking-wide">Vence: {formatDate(client.subscription_end_date)}</span></div></div>
          </div>
        </div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Histórico de Pagamentos</h3>
        <div className="space-y-4"><div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center opacity-60"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-slate-400" /></div><div><p className="font-bold text-slate-800 dark:text-slate-200">Mensalidade Anterior</p><p className="text-xs text-slate-400">{formatDate(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())}</p></div></div><span className="font-bold text-slate-400">{formattedAmount}</span></div></div>
      </div>
    </div>
  );
};

const ProfileTab: React.FC<{ client: User }> = ({ client }) => {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            localStorage.removeItem('gym_client_id');
            navigate('/client-login');
        } catch (error) {
            console.error("Logout error", error);
            localStorage.removeItem('gym_client_id');
            navigate('/client-login');
        }
    };
    const toggleTheme = () => { setDarkMode(!darkMode); document.documentElement.classList.toggle('dark'); };

    return (
        <div className="animate-fade-in pb-32 max-w-lg mx-auto">
          <div className="px-6 pt-12 pb-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300"><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meu Perfil</h1></div>
          <div className="p-6">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-3xl font-bold text-slate-500 border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden">{client.avatar ? <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" /> : client.name.charAt(0)}</div>
               <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">{client.name}</h2><p className="text-xs text-slate-400 font-medium mb-1">{client.phone}</p><span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Membro Ativo</span></div>
            </div>
            <div className="space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Configurações</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-700">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400"><Bell className="w-4 h-4" /></div><span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Notificações</span></div>
                            <button onClick={() => setNotifications(!notifications)} className={`w-11 h-6 rounded-full transition-colors relative ${notifications ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${notifications ? 'left-[22px]' : 'left-0.5'}`} /></button>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">{darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</div><span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Tema Escuro</span></div>
                            <button onClick={toggleTheme} className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${darkMode ? 'left-[22px]' : 'left-0.5'}`} /></button>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Sobre</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <button onClick={() => setShowTermsModal(true)} className="w-full p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700 transition-colors"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400"><FileText className="w-4 h-4" /></div><span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Termos de Uso</span></div><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                        <button onClick={() => window.open('https://wa.me/244921156899', '_blank')} className="w-full p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-700 transition-colors"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400"><HelpCircle className="w-4 h-4" /></div><span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Suporte / Ajuda</span></div><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                    </div>
                </div>
                <button onClick={() => setShowLogoutModal(true)} className="w-full py-4 text-rose-500 font-bold text-sm bg-rose-50 dark:bg-rose-900/20 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors flex items-center justify-center gap-2 mt-4"><LogOut className="w-4 h-4" /> Sair da conta</button>
                <p className="text-center text-[10px] text-slate-400 font-medium">Versão 1.0.5 (Demo)</p>
            </div>
          </div>

          <Modal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            title="Sair da Conta"
            type="danger"
            actions={
              <>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
                >
                  Sair
                </button>
              </>
            }
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4">
                <LogOut className="w-8 h-8" />
              </div>
              <p className="text-slate-600 mb-2">
                Deseja realmente sair da sua conta?
              </p>
            </div>
          </Modal>

          <Modal
            isOpen={showTermsModal}
            onClose={() => setShowTermsModal(false)}
            title="Termos de Uso"
            type="info"
            actions={
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
              >
                Entendi
              </button>
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">1. Respeito mútuo.</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">2. Pagamento em dia.</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">3. Uso de toalha obrigatório.</p>
            </div>
          </Modal>
        </div>
    );
};

const SupportTab: React.FC<{ client: User }> = ({ client }) => {
  const [supportMessage, setSupportMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) return;
    setIsSending(true);
    
    const newMessage: SupportMessage = {
      id: crypto.randomUUID(),
      user_id: client.id,
      type: SupportMessageType.GENERAL_SUPPORT,
      content: supportMessage,
      status: SupportMessageStatus.UNREAD,
      created_at: new Date().toISOString()
    };

    try {
      await saveSupportMessage(newMessage);
      setSendSuccess(true);
      setSupportMessage('');
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.error("Error sending support message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="animate-fade-in pb-32 h-full flex flex-col max-w-lg mx-auto">
      <div className="px-6 pt-12 pb-6 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-300">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suporte</h1>
      </div>
      <div className="p-6 pt-2 overflow-y-auto space-y-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-800">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Como podemos ajudar?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Envie sua dúvida, sugestão ou reporte um problema diretamente para nossa equipe.</p>
        </div>

        {sendSuccess ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 text-center animate-fade-in shadow-sm">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Mensagem Enviada!</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Nossa equipe responderá em breve.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea 
              className="w-full p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none shadow-sm transition-all"
              rows={6}
              placeholder="Digite sua mensagem detalhadamente aqui..."
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
            />
            <button 
              onClick={handleSendSupport}
              disabled={isSending || !supportMessage.trim()}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Mensagem'}
            </button>
            
            <div className="pt-4 flex flex-col items-center gap-4">
               <div className="flex items-center gap-2 text-slate-400">
                  <div className="h-px w-8 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Ou se preferir</span>
                  <div className="h-px w-8 bg-slate-200 dark:bg-slate-700" />
               </div>
               <button 
                 onClick={() => window.open('https://wa.me/244921156899', '_blank')}
                 className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
               >
                 <MessageCircle className="w-5 h-5" /> Falar pelo WhatsApp
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ClientHome: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inicio');
  const [client, setClient] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
        const clientId = localStorage.getItem('gym_client_id');
        if (!clientId) {
            navigate('/client-login');
            return;
        }
        const foundClient = await getUserById(clientId);
        if (!foundClient) {
            localStorage.removeItem('gym_client_id');
            navigate('/client-login');
            return;
        }
        setClient(foundClient);
        setLoading(false);
    };
    fetchClient();
  }, [navigate]);

  if (loading) return <Layout hideHeader><div className="flex flex-col items-center justify-center h-screen"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" /></div></Layout>;
  if (!client) return null;

  return (
    <Layout hideHeader>
      <div className="flex-1 flex flex-col relative dark:bg-slate-900 transition-colors duration-300">
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {activeTab === 'inicio' && <HomeTab client={client} changeTab={setActiveTab} />}
          {activeTab === 'aulas' && <ClassesTab client={client} />}
          {activeTab === 'planos' && <div className="p-6 pt-12"><PricingTable /></div>}
          {activeTab === 'pagamentos' && <PaymentsTab client={client} />}
          {activeTab === 'suporte' && <SupportTab client={client} />}
          {activeTab === 'perfil' && <ProfileTab client={client} />}
        </div>
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-3 pb-6 md:pb-6 lg:rounded-b-[2.5rem] z-50 transition-colors duration-300 mt-auto">
          <div className="flex justify-between items-end max-w-md mx-auto h-12">
            <button onClick={() => setActiveTab('inicio')} className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'inicio' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}><Home className="w-6 h-6" fill={activeTab === 'inicio' ? "currentColor" : "none"} /><span className="text-[10px] font-bold">Inicio</span></button>
            <button onClick={() => setActiveTab('aulas')} className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'aulas' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}><Dumbbell className="w-6 h-6" fill={activeTab === 'aulas' ? "currentColor" : "none"} /><span className="text-[10px] font-bold">Aulas</span></button>
            <button onClick={() => setActiveTab('suporte')} className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'suporte' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}><MessageCircle className="w-6 h-6" fill={activeTab === 'suporte' ? "currentColor" : "none"} /><span className="text-[10px] font-bold">Suporte</span></button>
            <button onClick={() => setActiveTab('pagamentos')} className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'pagamentos' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}><CreditCard className="w-6 h-6" fill={activeTab === 'pagamentos' ? "currentColor" : "none"} /><span className="text-[10px] font-bold">Financeiro</span></button>
            <button onClick={() => setActiveTab('perfil')} className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'perfil' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}><UserIcon className="w-6 h-6" fill={activeTab === 'perfil' ? "currentColor" : "none"} /><span className="text-[10px] font-bold">Perfil</span></button>
          </div>
        </div>
      </div>
    </Layout>
  );
};