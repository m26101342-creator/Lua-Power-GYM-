import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, User, Users, Trash2, Search, Clock, Info, X, ChevronRight, MousePointerClick, Banknote } from 'lucide-react';
import { Layout } from '../components/Layout';
import { getClasses, deleteClass } from '../services/classService';
import { GymClass } from '../types';

export const AdminClasses: React.FC = () => {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTutorial, setShowTutorial] = useState(true);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const cardsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const data = await getClasses();
    // Sort by time
    const sorted = data.sort((a, b) => a.startTime.localeCompare(b.startTime));
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
    if (window.confirm('Tem certeza que deseja excluir esta aula?')) {
      await deleteClass(id);
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

        {/* Horizontal Scrolling List */}
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
            <div className="flex gap-6 overflow-x-auto pb-12 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory pt-4">
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
                      snap-center flex-shrink-0 
                      w-[85%] md:w-[340px] 
                      p-6 rounded-[2rem] 
                      transition-all duration-500 ease-out cursor-pointer group
                      bg-white border
                      ${isFocused 
                        ? 'scale-100 opacity-100 shadow-xl shadow-slate-200/50 border-emerald-500/30 ring-4 ring-emerald-500/5 z-10' 
                        : 'scale-[0.92] opacity-60 grayscale-[0.5] shadow-sm border-slate-100 z-0'
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
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold bg-slate-50 px-3 py-2 rounded-xl">
                          <Users className="w-3.5 h-3.5" />
                          <span>{cls.maxSpots} Vagas</span>
                        </div>
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
              
              {/* Spacer for right padding in horizontal scroll */}
              <div className="w-2 flex-shrink-0" />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};