import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { saveClass, getClassById } from '../services/classService';
import { CustomTimePicker } from '../components/CustomTimePicker';
import { Modal } from '../components/Modal';
import { GymClass } from '../types';
import { Dumbbell, User, Clock, Users, Calendar, Check, Banknote, Loader2 } from 'lucide-react';

export const ManageClass: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<GymClass>({
    id: '',
    name: '',
    instructor: '',
    startTime: '08:00',
    duration: '60 min',
    maxSpots: 20,
    weekDays: [],
    price: 0,
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    const loadClass = async () => {
        if (id) {
          setLoading(true);
          const existing = await getClassById(id);
          if (existing) {
            setFormData({ ...existing, price: existing.price || 0 });
          }
          setLoading(false);
        } else {
          setFormData(prev => ({ ...prev, id: crypto.randomUUID() }));
        }
    };
    loadClass();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.weekDays.length === 0) {
      setAlertModal({
        isOpen: true,
        title: 'Atenção',
        message: 'Preencha o nome e selecione pelo menos um dia.'
      });
      return;
    }
    setIsSaving(true);
    await saveClass(formData);
    setIsSaving(false);
    navigate('/admin/classes');
  };

  const toggleDay = (dayIndex: number) => {
    setFormData(prev => {
      const days = prev.weekDays.includes(dayIndex)
        ? prev.weekDays.filter(d => d !== dayIndex)
        : [...prev.weekDays, dayIndex].sort();
      return { ...prev, weekDays: days };
    });
  };

  const weekDays = [
    { idx: 1, label: 'Segunda' },
    { idx: 2, label: 'Terça' },
    { idx: 3, label: 'Quarta' },
    { idx: 4, label: 'Quinta' },
    { idx: 5, label: 'Sexta' },
    { idx: 6, label: 'Sábado' },
    { idx: 0, label: 'Domingo' },
  ];

  if (loading) {
      return (
          <Layout title="Carregando...">
              <div className="flex justify-center items-center h-full pt-20">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              </div>
          </Layout>
      );
  }

  return (
    <Layout title={id ? "Editar Aula" : "Nova Aula"} showBack onBack={() => navigate('/admin/classes')}>
      <form onSubmit={handleSubmit} className="space-y-6 mt-2">
        
        {/* Name */}
        <div className="group">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Nome da Aula</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Dumbbell className="w-5 h-5 text-slate-400" />
            </div>
            <input
              required
              type="text"
              placeholder="Ex: Crossfit"
              className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl shadow-sm border-2 border-transparent focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-800"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
        </div>

        {/* Instructor */}
        <div className="group">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Instrutor</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <input
              required
              type="text"
              placeholder="Ex: Coach André"
              className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl shadow-sm border-2 border-transparent focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-800"
              value={formData.instructor}
              onChange={e => setFormData({...formData, instructor: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Time */}
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Horário</label>
            <div className="relative" onClick={() => setShowTimePicker(true)}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <div className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-emerald-500/50 outline-none transition-all font-medium text-slate-800 flex items-center h-[58px] cursor-pointer">
                 {formData.startTime}
              </div>
            </div>
            <CustomTimePicker 
                isOpen={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                value={formData.startTime}
                onChange={(t) => setFormData({...formData, startTime: t})}
            />
          </div>

          {/* Duration */}
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Duração</label>
            <input
              required
              type="text"
              placeholder="Ex: 60 min"
              className="w-full px-4 py-4 bg-white rounded-2xl shadow-sm border-2 border-transparent focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-800 text-center"
              value={formData.duration}
              onChange={e => setFormData({...formData, duration: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           {/* Capacity */}
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Vagas</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <input
                required
                type="number"
                min="1"
                className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl shadow-sm border-2 border-transparent focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-800"
                value={formData.maxSpots}
                onChange={e => setFormData({...formData, maxSpots: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          {/* Price */}
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Preço Padrão (Kz)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Banknote className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="number"
                min="0"
                className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl shadow-sm border-2 border-transparent focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-800"
                value={formData.price}
                onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
        </div>

        {/* Days Selection */}
        <div className="group">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Dias da Semana</label>
          <div className="grid grid-cols-2 gap-3">
            {weekDays.map((day) => {
              const isSelected = formData.weekDays.includes(day.idx);
              return (
                <button
                  key={day.idx}
                  type="button"
                  onClick={() => toggleDay(day.idx)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                      : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold text-sm">{day.label}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all duration-300 mt-4 text-lg flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Aula'}
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