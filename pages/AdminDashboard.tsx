import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MessageCircle, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  FileSpreadsheet, 
  Database,
  Download,
  Plus,
  Banknote,
  Users,
  Dumbbell,
  HelpCircle,
  X,
  ChevronRight,
  User as UserIcon,
  Trash2,
  Calendar,
  Info,
  MousePointerClick,
  TrendingUp,
  Loader2,
  Activity,
  RefreshCw,
  Home,
  Menu,
  PieChart,
  QrCode,
  Tags,
  Pencil
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { QRScanner } from '../components/QRScanner';
import { ScannedClientModal } from '../components/ScannedClientModal';
import { PricingTable } from '../components/PricingTable';
import { getStudents } from '../services/userService';
import { getClasses, deleteClass } from '../services/classService';
import { checkAndScheduleNotifications } from '../services/notificationService';
import { getAllMessages, updateMessageStatus, deleteMessage } from '../services/supportService';
import { generateClientListPDF } from '../services/pdfService';
import { User, UserStatus, GymClass, SupportMessage, SupportMessageStatus, SupportMessageType } from '../types';
import { getUserStatus, formatDate } from '../utils/dateUtils';
import { db, auth } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Bell } from 'lucide-react';
import { Modal } from '../components/Modal';

// --- COMPONENTS ---

const DonutChart: React.FC<{ active: number, warning: number, expired: number }> = ({ active, warning, expired }) => {
  const total = active + warning + expired;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  
  if (total === 0) return null;

  const activeOffset = 0;
  const activeDash = (active / total) * circumference;
  
  const warningOffset = -activeDash;
  const warningDash = (warning / total) * circumference;
  
  const expiredOffset = -(activeDash + warningDash);
  const expiredDash = (expired / total) * circumference;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between mb-8 h-full">
      <div className="relative w-32 h-32 flex items-center justify-center">
         <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
            
            {/* Segments */}
            {active > 0 && (
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#10b981" strokeWidth="12" 
                    strokeDasharray={`${activeDash} ${circumference}`} strokeDashoffset={activeOffset} className="transition-all duration-1000 ease-out" />
            )}
            {warning > 0 && (
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#fbbf24" strokeWidth="12" 
                    strokeDasharray={`${warningDash} ${circumference}`} strokeDashoffset={warningOffset} className="transition-all duration-1000 ease-out" />
            )}
            {expired > 0 && (
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#f43f5e" strokeWidth="12" 
                    strokeDasharray={`${expiredDash} ${circumference}`} strokeDashoffset={expiredOffset} className="transition-all duration-1000 ease-out" />
            )}
         </svg>
         <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">{total}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
         </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 pl-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-600">Ativos</span>
            </div>
            <span className="text-xs font-bold text-slate-800">{Math.round((active/total)*100)}%</span>
         </div>
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-slate-600">A Expirar</span>
            </div>
            <span className="text-xs font-bold text-slate-800">{Math.round((warning/total)*100)}%</span>
         </div>
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-slate-600">Vencidos</span>
            </div>
            <span className="text-xs font-bold text-slate-800">{Math.round((expired/total)*100)}%</span>
         </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [gymClasses, setGymClasses] = useState<GymClass[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'classes' | 'finance' | 'planos' | 'support' | 'tools'>('dashboard');
  const [tick, setTick] = useState(0); 
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showClassStudents, setShowClassStudents] = useState<string | null>(null);
  const [scannedClient, setScannedClient] = useState<User | null>(null);
  
  // Inline Tutorials State
  const [tabTutorials, setTabTutorials] = useState({
    dashboard: true,
    clients: true,
    finance: true,
    classes: true
  });

  // Classes Tab State
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [focusedClassId, setFocusedClassId] = useState<string | null>(null);
  const classCardsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Support Tab State
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Modal States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'danger' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Stats State
  const [stats, setStats] = useState({
    active: 0,
    warning: 0,
    expired: 0,
    totalRevenue: 0,
    topClasses: [] as {name: string, count: number, revenue: number}[]
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Simple auth check
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }

    // Initialize System
    const init = async () => {
        await loadDashboardData();
    };
    init();

    const timerInterval = setInterval(() => {
      setTick(t => t + 1);
      loadDashboardData();
    }, 60000); 

    return () => clearInterval(timerInterval);
  }, [navigate]);

  // Load Classes specific data when switching to classes tab
  useEffect(() => {
    const fetchClasses = async () => {
        if (activeTab === 'classes') {
            const data = await getClasses();
            const sorted = data.sort((a, b) => a.startTime.localeCompare(b.startTime));
            setGymClasses(sorted);
            if (sorted.length > 0 && !focusedClassId) {
                setFocusedClassId(sorted[0].id);
            }
        }
    };
    fetchClasses();
  }, [activeTab]);

  // Load Support Messages when switching to support tab
  useEffect(() => {
    const fetchMessages = async () => {
      if (activeTab === 'support') {
        setLoadingMessages(true);
        try {
          const messages = await getAllMessages();
          setSupportMessages(messages);
        } catch (error) {
          console.error("Failed to load messages:", error);
        } finally {
          setLoadingMessages(false);
        }
      }
    };
    fetchMessages();
  }, [activeTab]);

  // Intersection Observer for Classes Scroll Highlight
  useEffect(() => {
    if (activeTab !== 'classes') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFocusedClassId(entry.target.getAttribute('data-id'));
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.7,
      }
    );

    classCardsRef.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [gymClasses, activeTab, classSearchTerm]);


  const loadDashboardData = async () => {
      setRefreshing(true);
      const allClients = await getStudents();
      const allGymClasses = await getClasses();
      setGymClasses(allGymClasses);
      
      let activeCount = 0;
      let warningCount = 0;
      let expiredCount = 0;
      let totalRevenue = 0;
      const classMap = new Map<string, {count: number, revenue: number}>();
      const classEnrollmentMap = new Map<string, number>();

      // Create a price map for quick lookup
      const classPriceMap = new Map<string, {name: string, price: number}>();
      allGymClasses.forEach(cls => {
          classPriceMap.set(cls.id, { name: cls.name, price: cls.price || 0 });
          classEnrollmentMap.set(cls.id, 0);
      });

      allClients.forEach(client => {
        const statusData = getUserStatus(client);
        if (statusData.status === UserStatus.ACTIVE || statusData.status === UserStatus.WARNING) {
            if (statusData.status === UserStatus.ACTIVE) activeCount++;
            if (statusData.status === UserStatus.WARNING) warningCount++;
            
            // Use saved amount if available, otherwise fallback to sum of current class prices
            if (client.amount !== undefined && client.amount > 0) {
                totalRevenue += client.amount;
            } else if (client.enrolled_classes && client.enrolled_classes.length > 0) {
                client.enrolled_classes.forEach(classId => {
                    const classInfo = classPriceMap.get(classId);
                    if (classInfo) {
                        totalRevenue += classInfo.price;
                    }
                });
            }

            // Update class performance stats
            if (client.enrolled_classes && client.enrolled_classes.length > 0) {
                client.enrolled_classes.forEach(classId => {
                    const classInfo = classPriceMap.get(classId);
                    if (classInfo) {
                        const current = classMap.get(classInfo.name) || { count: 0, revenue: 0 };
                        classMap.set(classInfo.name, {
                            count: current.count + 1,
                            revenue: current.revenue + classInfo.price
                        });
                        
                        // Update enrollment count for the specific class ID
                        const currentEnrollment = classEnrollmentMap.get(classId) || 0;
                        classEnrollmentMap.set(classId, currentEnrollment + 1);
                    }
                });
            }
        }
        if (statusData.status === UserStatus.EXPIRED) expiredCount++;
      });

      // Update gym classes with enrollment counts
      const classesWithCounts = allGymClasses.map(cls => ({
          ...cls,
          enrolledCount: classEnrollmentMap.get(cls.id) || 0
      }));
      setGymClasses(classesWithCounts);

      // Sort Classes for Stats
      const topClasses = Array.from(classMap.entries())
        .map(([name, val]) => ({ name, ...val }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setStats({
        active: activeCount,
        warning: warningCount,
        expired: expiredCount,
        totalRevenue,
        topClasses
      });

      // Sort clients for List View
      const sorted = allClients.sort((a, b) => {
        const statusA = getUserStatus(a);
        const statusB = getUserStatus(b);
        const priority = { [UserStatus.EXPIRED]: 0, [UserStatus.WARNING]: 1, [UserStatus.ACTIVE]: 2, [UserStatus.PENDING_PAYMENT]: 3 };
        
        if (priority[statusA.status] !== priority[statusB.status]) {
          return priority[statusA.status] - priority[statusB.status];
        }
        return new Date(a.subscription_end_date).getTime() - new Date(b.subscription_end_date).getTime();
      });
      setClients(sorted);
      setLoading(false);
      setRefreshing(false);
      checkAndScheduleNotifications(sorted);
  };

  const handleWhatsApp = (e: React.MouseEvent, client: User) => {
    e.stopPropagation();
    const statusData = getUserStatus(client);
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

  const handleDeleteClass = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassToDelete(id);
  };

  const confirmDeleteClass = async () => {
    if (classToDelete) {
      await deleteClass(classToDelete);
      const data = await getClasses();
      const sorted = data.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setGymClasses(sorted);
      setClassToDelete(null);
    }
  };

  const handleExportPDF = async () => {
    await generateClientListPDF(clients);
  };

  const handleBackup = async () => {
    const clientsData = await getStudents();
    const classesData = await getClasses();
    
    const data = {
        clients: clientsData,
        classes: classesData,
        timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gym_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleSystemCheck = async () => {
    try {
      // Simple check to see if we can fetch clients
      await getStudents();
      setAlertModal({
        isOpen: true,
        title: "SISTEMA ONLINE",
        message: "Conexão com o banco de dados (Firebase) estabelecida com sucesso. Todos os sistemas estão operacionais.",
        type: "success"
      });
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: "ERRO DE CONEXÃO",
        message: "Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet ou as configurações do Firebase.",
        type: "danger"
      });
    }
  };

  const handleBroadcastMessage = async (message: string) => {
    try {
        setRefreshing(true);
        const notificationData = {
            title: 'Comunicado do Ginásio',
            message,
            created_at: new Date().toISOString(),
            is_global: true
        };
        
        await addDoc(collection(db, 'notifications'), notificationData);
        setAlertModal({
            isOpen: true,
            title: "Sucesso",
            message: "Mensagem enviada com sucesso para todos os alunos!",
            type: "success"
        });
    } catch (error) {
        console.error('Error sending broadcast:', error);
        setAlertModal({
            isOpen: true,
            title: "Erro",
            message: "Erro ao enviar mensagem.",
            type: "danger"
        });
    } finally {
        setRefreshing(false);
    }
  };

  const handleQRScan = (decodedText: string) => {
    setShowQRScanner(false);
    // Find client by QR code hash
    const client = clients.find(c => c.qr_code_hash === decodedText);
    if (client) {
      setScannedClient(client);
    } else {
      setAlertModal({
        isOpen: true,
        title: "Atenção",
        message: "QR Code inválido ou aluno não encontrado.",
        type: "warning"
      });
    }
  };

  const handleLogoutClick = () => {
      setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
      try {
          await auth.signOut();
          sessionStorage.removeItem('isAdmin');
          navigate('/admin-login');
      } catch (error) {
          console.error("Logout error", error);
          sessionStorage.removeItem('isAdmin');
          navigate('/admin-login');
      }
  };

  const closeTabTutorial = (tab: keyof typeof tabTutorials) => {
      setTabTutorials(prev => ({ ...prev, [tab]: false }));
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const filteredClasses = useMemo(() => {
    return gymClasses.filter(c => 
      c.name.toLowerCase().includes(classSearchTerm.toLowerCase()) || 
      c.instructor.toLowerCase().includes(classSearchTerm.toLowerCase())
    );
  }, [gymClasses, classSearchTerm]);

  const weekDayMap = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const getStatusColor = (status: UserStatus) => {
    switch(status) {
        case UserStatus.ACTIVE: return 'bg-emerald-500 shadow-emerald-500/50';
        case UserStatus.WARNING: return 'bg-amber-400 shadow-amber-400/50';
        case UserStatus.EXPIRED: return 'bg-rose-500 shadow-rose-500/50';
        case UserStatus.PENDING_PAYMENT: return 'bg-blue-500 shadow-blue-500/50';
        default: return 'bg-slate-300';
    }
  };
  
  const getBadgeStyle = (status: UserStatus) => {
    switch(status) {
        case UserStatus.ACTIVE: return 'bg-emerald-50 text-emerald-700';
        case UserStatus.WARNING: return 'bg-amber-50 text-amber-700';
        case UserStatus.EXPIRED: return 'bg-rose-50 text-rose-700';
        case UserStatus.PENDING_PAYMENT: return 'bg-blue-50 text-blue-700';
        default: return 'bg-slate-50 text-slate-700';
    }
  };

  const logoutButton = (
    <button onClick={handleLogoutClick} className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors lg:hidden">
      <LogOut className="w-5 h-5" />
    </button>
  );

  const getTabTitle = () => {
      switch(activeTab) {
          case 'dashboard': return 'Visão Geral';
          case 'clients': return 'Gestão de Alunos';
          case 'finance': return 'Financeiro';
          case 'classes': return 'Gestão de Aulas';
          case 'planos': return 'Planos';
          case 'support': return 'Suporte';
          case 'tools': return 'Ferramentas';
          default: return 'Gestão';
      }
  };

  if (loading && clients.length === 0) {
      return (
          <Layout title={getTabTitle()} hideHeader={true} fullWidth>
             <div className="flex flex-col items-center justify-center h-screen">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-slate-400">Iniciando Simulação...</p>
             </div>
          </Layout>
      );
  }

  // --- DESKTOP SIDEBAR COMPONENT ---
  const DesktopSidebar = () => (
    <div className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
             <img 
              src="https://i.postimg.cc/K86FS7PH/1000196294_fotor_enhance_20260107104529.jpg" 
              alt="Logo" 
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100" 
             />
             <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">Lua Power</h1>
                <p className="text-xs text-slate-400 mt-1">Admin Panel</p>
             </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
            {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Visão Geral' },
                { id: 'clients', icon: Users, label: 'Alunos' },
                { id: 'classes', icon: Dumbbell, label: 'Gestão de Aulas' },
                { id: 'planos', icon: Tags, label: 'Planos' },
                { id: 'finance', icon: Banknote, label: 'Financeiro' },
                { id: 'support', icon: MessageCircle, label: 'Suporte' },
                { id: 'tools', icon: Settings, label: 'Ferramentas' },
            ].map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                        activeTab === item.id 
                        ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                </button>
            ))}
        </div>

        <div className="p-4 border-t border-slate-100">
            <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors font-semibold"
            >
                <LogOut className="w-5 h-5" />
                Sair
            </button>
        </div>
    </div>
  );

  return (
    <div className="lg:flex bg-slate-100 min-h-screen">
      <DesktopSidebar />
      
      <div className="flex-1 min-w-0">
        <div className="flex-1 flex flex-col pb-24 lg:pb-0">
          {/* Header Mobile Only */}
          <div className="lg:hidden px-6 pt-8 pb-4 bg-white sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://i.postimg.cc/K86FS7PH/1000196294_fotor_enhance_20260107104529.jpg" 
                    alt="Logo" 
                    className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100" 
                  />
                  <div>
                      <h1 className="text-xl font-bold text-slate-900 leading-none">{getTabTitle()}</h1>
                      <p className="text-xs text-slate-400 mt-1">Área do Gestor</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                      onClick={loadDashboardData}
                      disabled={refreshing}
                      className="p-2 bg-slate-50 text-slate-600 rounded-full hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  >
                      <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                      onClick={handleLogoutClick}
                      className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
                      title="Sair"
                  >
                      <LogOut className="w-5 h-5" />
                  </button>
                </div>
            </div>

            {/* Desktop Header Actions */}
            <div className="hidden lg:flex justify-between items-center mb-8 pt-4 px-8">
               <div>
                  <h2 className="text-2xl font-bold text-slate-900">{getTabTitle()}</h2>
                  <p className="text-sm text-slate-500">Bem-vindo de volta, Administrador.</p>
               </div>
               <button 
                  onClick={loadDashboardData}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-all shadow-sm"
              >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
              </button>
            </div>

            <div className="flex-1 h-full px-6 lg:px-8">
            
            {/* === TAB 1: DASHBOARD (Home) === */}
            {activeTab === 'dashboard' && (
              <div className="animate-fade-in space-y-6">
                {/* 3 Main Stats Cards - Responsive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
                    <div className="mb-3 w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.active}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mt-1">Alunos Ativos</span>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
                    <div className="mb-3 w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.warning}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500 mt-1">A Expirar</span>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
                    <div className="mb-3 w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.expired}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500 mt-1">Vencidos</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <DonutChart active={stats.active} warning={stats.warning} expired={stats.expired} />
                    </div>
                    
                    {/* Quick Tip / Notification Area */}
                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col justify-center items-start gap-4 h-full">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900 mb-2 text-lg">Dica do Gestor</h3>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                Mantenha o contato frequente com alunos na fase de "Atenção". Uma mensagem personalizada aumenta a taxa de renovação em até 40%.
                            </p>
                        </div>
                        <button onClick={() => setActiveTab('clients')} className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                            Ver Lista de Alunos
                        </button>
                    </div>
                </div>
              </div>
            )}

            {/* === TAB 2: CLIENTS (List & Management) === */}
            {activeTab === 'clients' && (
              <div className="animate-fade-in space-y-6">
                {/* Search & Add */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative group flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar cliente por nome..."
                        className="block w-full pl-11 pr-4 py-4 bg-white border-0 rounded-2xl text-slate-900 shadow-[0_4px_20px_rgb(0,0,0,0.03)] placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <button 
                    onClick={() => navigate('/admin/add')}
                    className="w-full md:w-auto px-8 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-slate-800 active:scale-95 transition-all gap-2 font-bold py-4 md:py-0"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="md:hidden lg:inline">Novo Aluno</span>
                  </button>
                </div>

                {/* Client List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                  {filteredClients.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 opacity-50 bg-white rounded-3xl border border-dashed border-slate-200">
                      <div className="bg-slate-50 p-6 rounded-full mb-4">
                        <Search className="w-10 h-10 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium text-lg">Nenhum cliente encontrado</p>
                    </div>
                  ) : (
                    filteredClients.map((client, index) => {
                      const statusData = getUserStatus(client);
                      return (
                        <div
                          key={client.id}
                          onClick={() => navigate(`/client/${client.id}`)}
                          className="group bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 hover:border-emerald-100 transition-all duration-200 cursor-pointer relative hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {client.avatar ? (
                                <img src={client.avatar} alt={client.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-50 bg-slate-100 shadow-sm" />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-2xl border-2 border-slate-50 shadow-sm">
                                  {client.name.charAt(0)}
                                </div>
                              )}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-[3px] border-white ${getStatusColor(statusData.status)}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-800 text-lg truncate leading-tight mb-1">{client.name}</h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${getBadgeStyle(statusData.status)}`}>
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="text-xs font-bold tabular-nums tracking-tight">{statusData.timeString}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/edit/${client.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all duration-300 shadow-sm"
                                title="Editar Aluno"
                              >
                                <Pencil className="w-5 h-5" />
                              </Link>
                              <button
                                onClick={(e) => handleWhatsApp(e, client)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md"
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* === TAB 3: CLASSES === */}
            {activeTab === 'classes' && (
              <div className="animate-fade-in flex flex-col h-full relative pb-20">
                <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                    <div className="relative group flex-1 w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                        type="text"
                        placeholder="Buscar aula..."
                        className="block w-full pl-11 pr-4 py-4 bg-white border-0 rounded-2xl text-slate-900 shadow-[0_4px_20px_rgb(0,0,0,0.03)] placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                        value={classSearchTerm}
                        onChange={(e) => setClassSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => navigate('/admin/classes/add')} className="w-full md:w-auto px-6 h-[58px] bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-emerald-500 active:scale-95 transition-all gap-2 font-bold">
                        <Plus className="w-6 h-6" />
                        <span className="md:hidden lg:inline">Nova Aula</span>
                    </button>
                </div>

                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
                      {filteredClasses.length} Aulas Disponíveis
                  </h3>

                  {/* Grid for Classes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {filteredClasses.map((cls) => {
                        const isFocused = focusedClassId === cls.id;
                        return (
                        <div 
                            key={cls.id}
                            data-id={cls.id}
                            ref={(el) => {
                            if (el) classCardsRef.current.set(cls.id, el);
                            else classCardsRef.current.delete(cls.id);
                            }}
                            onClick={() => navigate(`/admin/classes/edit/${cls.id}`)}
                            className={`
                            relative flex flex-col justify-between 
                            p-6 rounded-[2rem] 
                            transition-all duration-300 ease-out cursor-pointer group
                            bg-white border hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1
                            ${isFocused 
                                ? 'shadow-xl shadow-slate-200/50 border-emerald-500/30 ring-4 ring-emerald-500/5 z-10' 
                                : 'shadow-sm border-slate-100 z-0'
                            }
                            `}
                        >
                            <div>
                            <div className="flex justify-between items-start mb-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm transition-colors bg-emerald-50 text-emerald-600`}>
                                {cls.name.charAt(0)}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`px-4 py-1.5 rounded-xl text-sm font-bold shadow-md transition-colors bg-slate-900 text-white shadow-slate-900/20`}>
                                        {cls.startTime}
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-100`}>
                                        <Banknote className="w-3 h-3" />
                                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(cls.price)}
                                    </div>
                                </div>
                            </div>
                            <h3 className={`font-bold text-2xl mb-2 line-clamp-1 transition-colors text-slate-900`}>{cls.name}</h3>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                                <UserIcon className="w-4 h-4" /> <span className="font-medium">{cls.instructor}</span>
                            </div>
                            </div>
                            <div className="space-y-5">
                            <div className="flex gap-1.5 justify-center">
                                {weekDayMap.map((day, idx) => (
                                <span key={idx} className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-bold transition-all ${cls.weekDays.includes(idx) ? 'bg-slate-800 text-white shadow-md transform -translate-y-1' : 'bg-slate-50 text-slate-300'}`}>{day}</span>
                                ))}
                            </div>
                            <div className={`flex items-center justify-between pt-5 border-t transition-colors border-slate-100`}>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowClassStudents(cls.id);
                                    }}
                                    className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
                                >
                                    <Users className="w-3.5 h-3.5" /> 
                                    <span>{(cls as any).enrolledCount || 0}/{cls.maxSpots} Alunos</span>
                                </button>
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold bg-slate-50 px-3 py-2 rounded-xl"><Clock className="w-3.5 h-3.5" /> <span>{cls.duration}</span></div>
                            </div>
                            </div>
                            <button onClick={(e) => handleDeleteClass(cls.id, e)} className={`absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm opacity-0 group-hover:opacity-100 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white`}><Trash2 className="w-4 h-4" /></button>
                        </div>
                        );
                    })}
                  </div>
              </div>
            )}

            {/* === TAB 4: FINANCE === */}
            {activeTab === 'finance' && (
                <div className="animate-fade-in space-y-6">
                    {/* Grid for Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Total Revenue Card */}
                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden h-full flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl translate-x-10 -translate-y-10 opacity-50"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4 text-emerald-400">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Banknote className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-wider">Receita Mensal Estimada</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className="text-5xl lg:text-6xl font-extrabold tracking-tight">{new Intl.NumberFormat('pt-AO').format(stats.totalRevenue)}</span>
                                    <span className="text-2xl text-slate-400 font-bold">Kz</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-1">
                                        <span className="block text-xs text-slate-400 uppercase tracking-wide">Ticket Médio</span>
                                        <span className="block text-xl font-bold text-white">
                                            {stats.active > 0 
                                            ? new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(stats.totalRevenue / stats.active) 
                                            : '0'} Kz
                                        </span>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-1">
                                        <span className="block text-xs text-slate-400 uppercase tracking-wide">Pagantes Ativos</span>
                                        <span className="block text-xl font-bold text-white">{stats.active}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Popular Classes */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-emerald-500" />
                                Performance de Aulas
                            </h3>
                            <div className="space-y-3 flex-1 overflow-auto pr-2 custom-scrollbar">
                                {stats.topClasses.map((cls, idx) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors hover:bg-white hover:shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 font-bold text-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200' : 'bg-slate-200'}`}>
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{cls.name}</h4>
                                                <p className="text-xs text-slate-500">{cls.count} alunos ativos</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                            {new Intl.NumberFormat('pt-AO', { compactDisplay: 'short', notation: 'compact' }).format(cls.revenue)} Kz
                                        </span>
                                    </div>
                                ))}
                                {stats.topClasses.length === 0 && (
                                    <p className="text-center text-slate-400 py-4">Sem dados suficientes.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === TAB 5: PLANOS === */}
            {activeTab === 'planos' && (
              <div className="animate-fade-in space-y-6 pb-20 max-w-4xl mx-auto">
                <PricingTable />
              </div>
            )}

            {/* === TAB 6: SUPPORT === */}
            {activeTab === 'support' && (
              <div className="animate-fade-in space-y-6 pb-20 max-w-4xl mx-auto">
                 {loadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                 ) : supportMessages.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center py-24">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                          <MessageCircle className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Sem mensagens</h3>
                        <p className="text-slate-500 text-center max-w-md">
                          Não há mensagens de suporte ou comprovativos no momento.
                        </p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                        {supportMessages.map((msg) => {
                            const client = clients.find(c => c.id === msg.user_id);
                            return (
                                <div key={msg.id} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                <UserIcon className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{client?.name || 'Aluno Desconhecido'}</h4>
                                                <p className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleString('pt-AO')}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            msg.status === SupportMessageStatus.UNREAD ? 'bg-blue-100 text-blue-700' :
                                            msg.status === SupportMessageStatus.READ ? 'bg-slate-100 text-slate-700' :
                                            msg.status === SupportMessageStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-rose-100 text-rose-700'
                                        }`}>
                                            {msg.status === SupportMessageStatus.UNREAD ? 'Não Lido' :
                                             msg.status === SupportMessageStatus.READ ? 'Lido' :
                                             msg.status === SupportMessageStatus.APPROVED ? 'Aprovado' : 'Rejeitado'}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded mb-2">
                                            {msg.type === SupportMessageType.PAYMENT_PROOF ? 'Comprovativo' : 'Suporte Geral'}
                                        </span>
                                        {msg.content && <p className="text-slate-700 text-sm">{msg.content}</p>}
                                    </div>

                                    {msg.attachment_url && (
                                        <div className="mb-4">
                                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1">
                                                <FileSpreadsheet className="w-4 h-4" /> Ver Anexo
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                        {msg.status === SupportMessageStatus.UNREAD && (
                                            <button 
                                                onClick={async () => {
                                                    await updateMessageStatus(msg.id, SupportMessageStatus.READ);
                                                    setSupportMessages(msgs => msgs.map(m => m.id === msg.id ? {...m, status: SupportMessageStatus.READ} : m));
                                                }}
                                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                                            >
                                                Marcar como Lido
                                            </button>
                                        )}
                                        {msg.type === SupportMessageType.PAYMENT_PROOF && msg.status !== SupportMessageStatus.APPROVED && (
                                            <button 
                                                onClick={async () => {
                                                    await updateMessageStatus(msg.id, SupportMessageStatus.APPROVED);
                                                    setSupportMessages(msgs => msgs.map(m => m.id === msg.id ? {...m, status: SupportMessageStatus.APPROVED} : m));
                                                }}
                                                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-colors"
                                            >
                                                Aprovar Pagamento
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setMessageToDelete(msg.id)}
                                            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors ml-auto flex items-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" /> Excluir
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 )}
              </div>
            )}

            {/* === TAB 6: TOOLS (Mais) === */}
            {activeTab === 'tools' && (
              <div className="animate-fade-in space-y-8 pb-20 max-w-4xl mx-auto">
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2 mb-4">Comunicação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={() => {
                                const msg = window.prompt('Digite a mensagem para enviar a todos os alunos:');
                                if (msg) {
                                    handleBroadcastMessage(msg);
                                }
                            }}
                            className="group bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-900/5 transition-all"
                        >
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform"><Bell className="w-7 h-7" /></div>
                            <div className="text-left flex-1">
                                <h3 className="font-bold text-slate-800 text-lg">Notificar Todos</h3>
                                <p className="text-sm text-slate-500 mt-1">Enviar mensagem para todos os alunos</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500" />
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2 mb-4">Relatórios & Documentos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={handleExportPDF} className="group bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all">
                            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform"><FileSpreadsheet className="w-7 h-7" /></div>
                            <div className="text-left flex-1">
                                <h3 className="font-bold text-slate-800 text-lg">Lista de Alunos</h3>
                                <p className="text-sm text-slate-500 mt-1">Gerar PDF completo com todos os dados</p>
                            </div>
                            <Download className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2 mb-4">Gerenciamento de Dados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={handleBackup} className="group bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><Database className="w-7 h-7" /></div>
                            <div className="text-left flex-1">
                                <h3 className="font-bold text-slate-800 text-lg">Backup do Sistema</h3>
                                <p className="text-sm text-slate-500 mt-1">Baixar arquivo JSON de segurança</p>
                            </div>
                            <Download className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2 mb-4">Controle de Acesso</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => setShowQRScanner(true)} className="group bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><QrCode className="w-7 h-7" /></div>
                            <div className="text-left flex-1">
                                <h3 className="font-bold text-slate-800 text-lg">Escanear QR Code</h3>
                                <p className="text-sm text-slate-500 mt-1">Realizar check-in de aluno</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2 mb-4">Manutenção</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={handleSystemCheck} className="group bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-900/5 transition-all">
                            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform"><Activity className="w-7 h-7" /></div>
                            <div className="text-left flex-1">
                                <h3 className="font-bold text-slate-800 text-lg">Diagnóstico</h3>
                                <p className="text-sm text-slate-500 mt-1">Verificar status da conexão e dados</p>
                            </div>
                        </button>
                    </div>
                </div>
              </div>
            )}
          </div>

          {showQRScanner && (
            <QRScanner 
              onScan={handleQRScan} 
              onClose={() => setShowQRScanner(false)} 
            />
          )}

          {scannedClient && (
            <ScannedClientModal 
              client={scannedClient} 
              onClose={() => setScannedClient(null)} 
            />
          )}

          {showClassStudents && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                {gymClasses.find(c => c.id === showClassStudents)?.name}
                            </h3>
                            <p className="text-sm text-slate-500">Alunos matriculados nesta aula</p>
                        </div>
                        <button 
                            onClick={() => setShowClassStudents(null)}
                            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {clients.filter(client => client.enrolled_classes?.includes(showClassStudents)).length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Nenhum aluno matriculado.</p>
                            </div>
                        ) : (
                            clients.filter(client => client.enrolled_classes?.includes(showClassStudents)).map(client => (
                                <div 
                                    key={client.id}
                                    onClick={() => {
                                        setShowClassStudents(null);
                                        navigate(`/client/${client.id}`);
                                    }}
                                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                                >
                                    {client.avatar ? (
                                        <img src={client.avatar} alt={client.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg border-2 border-white shadow-sm">
                                            {client.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 truncate">{client.name}</h4>
                                        <p className="text-xs text-slate-500">{client.phone}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                        <button 
                            onClick={() => setShowClassStudents(null)}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
          )}

          {/* BOTTOM NAVIGATION (Mobile Only) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 pb-6 z-50">
              <div className="flex justify-between items-end max-w-md mx-auto h-12">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutDashboard className="w-6 h-6" fill={activeTab === 'dashboard' ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold">Início</span>
                </button>

                <button 
                  onClick={() => setActiveTab('clients')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'clients' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Users className="w-6 h-6" fill={activeTab === 'clients' ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold">Alunos</span>
                </button>

                <button 
                  onClick={() => setActiveTab('classes')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'classes' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Dumbbell className="w-6 h-6" fill={activeTab === 'classes' ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold">Aulas</span>
                </button>

                <button 
                  onClick={() => setActiveTab('finance')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'finance' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Banknote className="w-6 h-6" fill={activeTab === 'finance' ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold">Financeiro</span>
                </button>

                <button 
                  onClick={() => setActiveTab('planos')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'planos' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Tags className="w-6 h-6" fill={activeTab === 'planos' ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold">Planos</span>
                </button>

                <button 
                  onClick={() => setActiveTab('support')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'support' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <MessageCircle className="w-6 h-6" fill={activeTab === 'support' ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold">Suporte</span>
                </button>

                <button 
                  onClick={() => setActiveTab('tools')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 ${activeTab === 'tools' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Menu className="w-6 h-6" />
                  <span className="text-[10px] font-bold">Mais</span>
                </button>
              </div>
          </div>

          {/* Modals */}
          <Modal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            title="Sair do Sistema"
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
                  onClick={confirmLogout}
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
                Deseja realmente sair do painel de administração?
              </p>
            </div>
          </Modal>

          <Modal
            isOpen={!!classToDelete}
            onClose={() => setClassToDelete(null)}
            title="Excluir Aula"
            type="danger"
            actions={
              <>
                <button
                  onClick={() => setClassToDelete(null)}
                  className="px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteClass}
                  className="px-4 py-2 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
                >
                  Excluir
                </button>
              </>
            }
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <p className="text-slate-600 mb-2">
                Tem certeza que deseja excluir esta aula?
              </p>
              <p className="text-sm text-slate-500">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </Modal>

          <Modal
            isOpen={!!messageToDelete}
            onClose={() => setMessageToDelete(null)}
            title="Excluir Mensagem"
            type="danger"
            actions={
              <>
                <button
                  onClick={() => setMessageToDelete(null)}
                  className="px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (messageToDelete) {
                      await deleteMessage(messageToDelete);
                      setSupportMessages(msgs => msgs.filter(m => m.id !== messageToDelete));
                      setMessageToDelete(null);
                    }
                  }}
                  className="px-4 py-2 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
                >
                  Excluir
                </button>
              </>
            }
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <p className="text-slate-600 mb-2">
                Tem certeza que deseja excluir esta mensagem?
              </p>
            </div>
          </Modal>

          <Modal
            isOpen={alertModal.isOpen}
            onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
            title={alertModal.title}
            type={alertModal.type}
            actions={
              <button
                onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                className={`px-4 py-2 text-white font-bold rounded-xl transition-colors shadow-md ${
                  alertModal.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' :
                  alertModal.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' :
                  alertModal.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                  'bg-slate-500 hover:bg-slate-600 shadow-slate-500/20'
                }`}
              >
                OK
              </button>
            }
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                alertModal.type === 'danger' ? 'bg-rose-100 text-rose-500' :
                alertModal.type === 'success' ? 'bg-emerald-100 text-emerald-500' :
                alertModal.type === 'warning' ? 'bg-amber-100 text-amber-500' :
                'bg-slate-100 text-slate-500'
              }`}>
                {alertModal.type === 'danger' ? <XCircle className="w-8 h-8" /> :
                 alertModal.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> :
                 alertModal.type === 'warning' ? <AlertTriangle className="w-8 h-8" /> :
                 <Info className="w-8 h-8" />}
              </div>
              <p className="text-slate-600 whitespace-pre-line">
                {alertModal.message}
              </p>
            </div>
          </Modal>

        </div>
      </div>
    </div>
  );
};