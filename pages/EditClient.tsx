import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { Modal } from '../components/Modal';
import { saveUser, getUserById } from '../services/userService';
import { getClasses } from '../services/classService';
import { calculateExpiryDate, formatDate } from '../utils/dateUtils';
import { User, Phone, Calendar, Clock, ChevronRight, Camera, X, FileText, Banknote, Check, Loader2 } from 'lucide-react';
import { GymClass } from '../types';

export const EditClient: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    duration: '30',
    amount: '0',
    avatar: '',
    notes: '',
  });

  const [availableClasses, setAvailableClasses] = useState<GymClass[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Map<string, number>>(new Map());
  const [errors, setErrors] = useState<{name?: string, phone?: string}>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    const loadData = async () => {
        const classes = await getClasses();
        setAvailableClasses(classes);
        
        if (id) {
          const client = await getUserById(id);
          if (client) {
            const phone = client.phone || '';
            let formattedPhone = phone;
            if (formattedPhone && !formattedPhone.trim().startsWith('+244')) {
               formattedPhone = `+244 ${formattedPhone.trim()}`;
            }
    
            let safeStartDate = new Date().toISOString().split('T')[0];
            if (client.subscription_start_date) {
              try { safeStartDate = client.subscription_start_date.split('T')[0]; } catch(e) {}
            }
    
            let diffDays = 30;
            if (client.subscription_start_date && client.subscription_end_date) {
                try {
                    const start = new Date(client.subscription_start_date).getTime();
                    const end = new Date(client.subscription_end_date).getTime();
                    if (!isNaN(start) && !isNaN(end)) {
                        diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
                    }
                } catch(e) {}
            }

            setFormData({
              name: client.name || '',
              phone: formattedPhone,
              startDate: safeStartDate,
              duration: diffDays.toString(),
              amount: (client.amount || 0).toString(),
              avatar: client.avatar || '',
              notes: client.notes || '',
            });
    
            if (client.enrolled_classes) {
                const map = new Map();
                client.enrolled_classes.forEach(classId => {
                    const cls = classes.find(c => c.id === classId);
                    if (cls) {
                        map.set(classId, cls.price);
                    }
                });
                setSelectedClasses(map);
            }
          } else {
            navigate('/admin/dashboard');
          }
        }
        setIsLoading(false);
    };

    loadData();
  }, [id, navigate]);

  useEffect(() => {
    let total = 0;
    selectedClasses.forEach((price) => total += price);
    if (total > 0) {
        setFormData(prev => ({ ...prev, amount: total.toString() }));
    }
  }, [selectedClasses]);

  const toggleClass = (cls: GymClass) => {
    const newSelected = new Map(selectedClasses);
    if (newSelected.has(cls.id)) {
        newSelected.delete(cls.id);
    } else {
        newSelected.set(cls.id, cls.price || 0);
    }
    setSelectedClasses(newSelected);
  };

  const updateClassPrice = (classId: string, newPrice: string) => {
    const price = parseFloat(newPrice) || 0;
    const newSelected = new Map(selectedClasses);
    if (newSelected.has(classId)) {
        newSelected.set(classId, price);
        setSelectedClasses(newSelected);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAlertModal({
          isOpen: true,
          title: 'Arquivo muito grande',
          message: 'A imagem deve ter menos de 2MB.'
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors: {name?: string, phone?: string} = {};
    const cleanPhone = formData.phone.replace(/\D/g, '');

    if (!formData.name.trim()) newErrors.name = "O nome é obrigatório.";
    if (!cleanPhone || cleanPhone.length < 12) {
      newErrors.phone = "Número inválido (falta dígitos).";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !validateForm()) return;
    setIsSaving(true);

    const durationDays = parseInt(formData.duration) || 30;
    const validStartDate = formData.startDate || new Date().toISOString().split('T')[0];
    const expiryDate = calculateExpiryDate(validStartDate, durationDays);
    const cleanAmount = formData.amount ? parseFloat(formData.amount.toString().replace(/[^0-9.]/g, '')) : 0;

    const existingUser = await getUserById(id);
    if (!existingUser) {
      setIsSaving(false);
      return;
    }

    await saveUser({
      ...existingUser,
      name: formData.name,
      phone: formData.phone,
      subscription_start_date: validStartDate,
      subscription_end_date: expiryDate,
      avatar: formData.avatar,
      notes: formData.notes,
      enrolled_classes: Array.from(selectedClasses.keys()),
      amount: cleanAmount,
      durationDays: durationDays,
      updated_at: new Date().toISOString()
    });

    setIsSaving(false);
    navigate('/admin/dashboard');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.startsWith('+244 ')) {
       const cleanRest = value.replace(/\D/g, '').replace(/^244/, ''); 
       setFormData(prev => ({ ...prev, phone: `+244 ${cleanRest}` }));
    } else {
       setFormData(prev => ({ ...prev, phone: value }));
    }
    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
  };

  if (isLoading) {
      return (
        <Layout title="Editar Cliente">
            <div className="flex justify-center items-center h-full pt-20">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
        </Layout>
      );
  }

  return (
    <Layout title="Editar Cliente" showBack onBack={() => navigate('/admin/dashboard')}>
      <form onSubmit={handleSubmit} className="space-y-8 mt-2" noValidate>
        
        <div className="flex justify-center mb-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-28 h-28 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group overflow-hidden shadow-inner"
          >
            {formData.avatar ? (
              <>
                <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={removeImage} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="text-white w-8 h-8" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Foto</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="group">
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${errors.name ? 'text-rose-500' : 'text-slate-400'}`}>Nome Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className={`w-5 h-5 transition-colors ${errors.name ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-emerald-500'}`} />
              </div>
              <input
                type="text"
                className={`w-full pl-11 pr-4 py-4 bg-white rounded-2xl shadow-sm placeholder:text-slate-300 transition-all font-medium border-2 ${errors.name ? 'border-rose-300 text-rose-900 bg-rose-50/50' : 'border-transparent text-slate-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50'} focus:outline-none`}
                placeholder="Ex: João Silva"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
              />
            </div>
             {errors.name && <p className="mt-2 ml-1 text-sm text-rose-500 font-medium animate-fade-in">{errors.name}</p>}
          </div>

          <div className="group">
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${errors.phone ? 'text-rose-500' : 'text-slate-400'}`}>WhatsApp (Angola)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className={`w-5 h-5 transition-colors ${errors.phone ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-emerald-500'}`} />
              </div>
              <input
                type="tel"
                className={`w-full pl-11 pr-4 py-4 bg-white rounded-2xl shadow-sm placeholder:text-slate-300 transition-all font-medium border-2 ${errors.phone ? 'border-rose-300 text-rose-900 bg-rose-50/50' : 'border-transparent text-slate-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50'} focus:outline-none`}
                placeholder="930 451 477"
                value={formData.phone}
                onChange={handlePhoneChange}
              />
            </div>
             {errors.phone && <p className="mt-2 ml-1 text-sm text-rose-500 font-medium animate-fade-in">{errors.phone}</p>}
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Selecionar Modalidade (Aula)</label>
            <div className="space-y-3">
               {availableClasses.map(cls => {
                 const isSelected = selectedClasses.has(cls.id);
                 return (
                   <div key={cls.id} className={`p-4 rounded-2xl border-2 transition-all ${isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent shadow-sm'}`}>
                      <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => toggleClass(cls)}>
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                             {isSelected && <Check className="w-4 h-4" />}
                          </div>
                          <span className="font-bold text-slate-800">{cls.name}</span>
                      </div>
                      
                      {isSelected && (
                         <div className="ml-9 animate-fade-in">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Valor (Kz)</label>
                            <input 
                              type="number" 
                              className="w-full p-2 bg-white rounded-xl border border-emerald-200 text-emerald-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              value={selectedClasses.get(cls.id) || 0}
                              onChange={(e) => updateClassPrice(cls.id, e.target.value)}
                            />
                         </div>
                      )}
                   </div>
                 );
               })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Início</label>
              <div className="relative" onClick={() => setShowDatePicker(true)}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <div className="w-full pl-11 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl shadow-sm text-slate-800 transition-all font-medium cursor-pointer hover:border-emerald-100 hover:bg-emerald-50/30 flex items-center h-[58px]">
                  {formatDate(formData.startDate)}
                </div>
              </div>
              <CustomDatePicker 
                isOpen={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={formData.startDate}
                onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Duração (Dias)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Clock className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full pl-11 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl shadow-sm text-slate-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50 focus:outline-none transition-all font-medium"
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Total a Pagar (Kz)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Banknote className="w-5 h-5 text-emerald-500" />
              </div>
              <input
                type="number"
                className="w-full pl-11 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl shadow-sm text-emerald-700 placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50 focus:outline-none transition-all font-bold text-lg"
                placeholder="0"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Observações</label>
            <div className="relative">
              <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                <FileText className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <textarea
                className="w-full pl-11 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl shadow-sm text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50 focus:outline-none transition-all font-medium resize-none leading-relaxed"
                rows={4}
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider">Vencimento Previsto</span>
            <span className="text-emerald-900 font-bold text-lg">
              {new Date(calculateExpiryDate(formData.startDate, parseInt(formData.duration) || 0)).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-2xl shadow-lg transition-all mt-8 text-lg flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Alterações'}
        </button>
      </form>

      <Modal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
      >
        <p className="text-slate-600 mb-6">{alertModal.message}</p>
        <button
          onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
          className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all"
        >
          Entendi
        </button>
      </Modal>
    </Layout>
  );
};
