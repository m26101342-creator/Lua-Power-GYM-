import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, User, Users, Trash2, Search, Clock, Info, X, ChevronRight, MousePointerClick, Banknote, AlertTriangle } from 'lucide-react';
import { Layout } from '../components/Layout';
import { getClasses, deleteClass } from '../services/classService';
import { getStudents } from '../services/userService';
import { GymClass, UserStatus } from '../types';
import { getUserStatus } from '../utils/dateUtils';
import { Modal } from '../components/Modal';

export const AdminClasses: React.FC = () => {
  const [classes, setClasses] = useState<(GymClass & { enrolledCount?: number })[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTutorial, setShowTutorial] = useState(true);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [showClassStudents, setShowClassStudents] = useState<string | null>(null);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const cardsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const [classData, clientData] = await Promise.all([
      getClasses(),
      getStudents()
    ]);

    setStudents(clientData);

    // Calculate enrollment counts
    const enrollmentMap = new Map<string, number>();
    classData.forEach(cls => enrollmentMap.set(cls.id, 0));

    clientData.forEach(client => {
      const statusData = getUserStatus(client);
      if (statusData.status === UserStatus.ACTIVE || statusData.status === UserStatus.WARNING) {
        if (client.enrolled_classes) {
          client.enrolled_classes.forEach(classId => {
            if (enrollmentMap.has(classId)) {
              enrollmentMap.set(classId, (enrollmentMap.get(classId) || 0) + 1);
            }
          });
        }
      }
    });

    const classesWithCounts = classData.map(cls => ({
      ...cls,
      enrolledCount: enrollmentMap.get(cls.id) || 0
    }));

    // Sort by time
    const sorted = classesWithCounts.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setClasses(sorted);
    // Focus the first one initially
    if (sorted.length > 0) {
        setFocusedId(sorted[0].id);
    }
  };

  // Intersection Observer for Scroll Highlight Effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFocusedId(entry.target.getAttribute('data-id'));
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.7, // Trigger when 70% of the item is visible
      }
    );

    cardsRef.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [classes, searchTerm]); // Re-run when list changes

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassToDelete(id);
  };

  const confirmDelete = async () => {
    if (classToDelete) {
      await deleteClass(classToDelete);
      setClassToDelete(null);
      loadClasses();
    }
  };

  const weekDayMap = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Header Action Button
  const addAction = (
    <button
      onClick={() => navigate('/admin/classes/add')}
      className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors shadow-sm"
    >
      <Plus className="w-5 h-5" />
    </button>
  );

  return (
    <Layout title="Gestão de Aulas" showBack onBack={() => navigate('/admin/dashboard')} action={addAction}>
      <div className="flex flex-col h-full relative">
        
        {/* Tutorial Banner */}
        {showTutorial && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100 relative animate-fade-in">
             <button 
               onClick={() => setShowTutorial(false)}
               className="absolute top-2 right-2 p-1 text-blue-400 hover:bg-blue-100 rounded-full transition-colors"
             >
               <X className="w-4 h-4" />
             </button>
             <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 mt-1">
                   <Info className="w-4 h-4" />
                </div>
                <div>
                   <h3 className="font-bold text-blue-900 text-sm mb-1">Como Gerenciar</h3>
                   <ul className="space-y-1">
                      <li className="text-xs text-blue-700 flex items-center gap-1.5">
                        <ChevronRight className="w-3 h-3" /> Deslize para os lados para navegar.
                      </li>
                      <li className="text-xs text-blue-700 flex items-center gap-1.5">
                        <MousePointerClick className="w-3 h-3" /> Toque no card para <b>editar</b>.
                      </li>
                      <li className="text-xs text-blue-700 flex items-center gap-1.5">
                        <Trash2 className="w-3 h-3" /> Use o ícone de lixeira para <b>excluir</b>.
                      </li>
                   </ul>
                </div>
             </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative group mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Buscar aula ou instrutor..."
            className="block w-full pl-11 pr-4 py-4 bg-white border-0 rounded-2xl text-slate-900 shadow-[0_4px_20px_rgb(0,0,0,0.03)] placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid List */}
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
            {filteredClasses.length} {filteredClasses.length === 1 ? 'Aula Encontrada' : 'Aulas Encontradas'}
          </h3>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma aula encontrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 pt-4">
              {filteredClasses.map((cls) => {
                const isFocused = focusedId === cls.id;
                
                return (
                  <div 
                    key={cls.id}
                    data-id={cls.id}
                    ref={(el) => {
                      if (el) cardsRef.current.set(cls.id, el);
                      else cardsRef.current.delete(cls.id);
                    }}
                    onClick={() => navigate(`/admin/classes/edit/${cls.id}`)}
                    className={`
                      relative flex flex-col justify-between 
                      p-6 rounded-[2rem] 
                      transition-all duration-500 ease-out cursor-pointer group
                      bg-white border
                      ${isFocused 
                        ? 'scale-100 opacity-100 shadow-xl shadow-slate-200/50 border-emerald-500/30 ring-4 ring-emerald-500/5 z-10' 
                        : 'shadow-sm border-slate-100 z-0'
                      }
                    `}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-5">
                        <div className={`
                          w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm transition-colors
                          ${isFocused ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}
                        `}>
                          {cls.name.charAt(0)}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                           <div className={`
                             px-4 py-1.5 rounded-xl text-sm font-bold shadow-md transition-colors
                             ${isFocused ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-slate-100 text-slate-400'}
                           `}>
                              {cls.startTime}
                           </div>
                           
                           {/* Price Badge */}
                           <div className={`
                             px-3 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1
                             ${isFocused 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-slate-50 text-slate-400 border-slate-100'}
                           `}>
                                <Banknote className="w-3 h-3" />
                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(cls.price)}
                           </div>
                        </div>
                      </div>

                      <h3 className={`font-bold text-2xl mb-2 line-clamp-1 transition-colors ${isFocused ? 'text-slate-900' : 'text-slate-600'}`}>
                        {cls.name}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{cls.instructor}</span>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Weekdays */}
                      <div className="flex gap-1.5 justify-center">
                        {weekDayMap.map((day, idx) => (
                          <span 
                            key={idx} 
                            className={`
                              w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-bold transition-all
                              ${cls.weekDays.includes(idx) 
                                ? (isFocused ? 'bg-slate-800 text-white shadow-md transform -translate-y-1' : 'bg-slate-600 text-white') 
                                : 'bg-slate-50 text-slate-300'
                              }
                            `}
                          >
                            {day}
                          </span>
                        ))}
                      </div>

                      {/* Footer Info */}
                      <div className={`
                        flex items-center justify-between pt-5 border-t transition-colors
                        ${isFocused ? 'border-slate-100' : 'border-slate-50'}
                      `}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowClassStudents(cls.id);
                          }}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${isFocused ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400'}`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{cls.enrolledCount || 0}/{cls.maxSpots} Alunos</span>
                        </button>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold bg-slate-50 px-3 py-2 rounded-xl">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{cls.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button - Only visible when focused or hovered */}
                    <button 
                      onClick={(e) => handleDelete(cls.id, e)}
                      className={`
                        absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm
                        ${isFocused 
                          ? 'bg-rose-50 text-rose-500 opacity-100 hover:bg-rose-500 hover:text-white' 
                          : 'bg-slate-50 text-slate-300 opacity-0'
                        }
                      `}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showClassStudents && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                          <h3 className="text-xl font-bold text-slate-900">
                              {classes.find(c => c.id === showClassStudents)?.name}
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
                      {students.filter(client => client.enrolled_classes?.includes(showClassStudents)).length === 0 ? (
                          <div className="py-12 text-center text-slate-400">
                              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                              <p>Nenhum aluno matriculado.</p>
                          </div>
                      ) : (
                          students.filter(client => client.enrolled_classes?.includes(showClassStudents)).map(client => (
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
      </div>
      
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
              onClick={confirmDelete}
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
            Esta ação não pode ser desfeita e removerá a aula da grade de horários.
          </p>
        </div>
      </Modal>
    </Layout>
  );
};