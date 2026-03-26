import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Check } from 'lucide-react';

interface CustomDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // ISO String YYYY-MM-DD
  onChange: (date: string) => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ isOpen, onClose, selectedDate, onChange }) => {
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      // Quando abrir, foca na data selecionada ou na data atual
      const initialDate = selectedDate ? new Date(selectedDate) : new Date();
      // Ajuste para garantir que a data seja exibida corretamente sem problemas de fuso horário
      const userTimezoneOffset = initialDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(initialDate.getTime() + userTimezoneOffset);
      setViewDate(adjustedDate);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Formata para YYYY-MM-DD manualmente para evitar problemas de UTC
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    
    onChange(`${year}-${month}-${dayStr}`);
    onClose();
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(viewDate.getMonth(), viewDate.getFullYear());
    const startDay = firstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear());

    // Padding para dias vazios no início do mês
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    // Dias do mês
    for (let i = 1; i <= totalDays; i++) {
      const currentDayString = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isSelected = currentDayString === selectedDate;
      const isToday = new Date().toISOString().split('T')[0] === currentDayString;

      days.push(
        <button
          key={i}
          onClick={(e) => { e.preventDefault(); handleDateClick(i); }}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
            ${isSelected 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110' 
              : isToday 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }
          `}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-[340px] rounded-[2rem] shadow-2xl relative z-10 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Selecionar Data</span>
            <h2 className="text-xl font-extrabold text-slate-800">
              {months[viewDate.getMonth()]} <span className="text-slate-400">{viewDate.getFullYear()}</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Body */}
        <div className="p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={(e) => { e.preventDefault(); handlePrevMonth(); }} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="h-1 w-12 bg-slate-100 rounded-full" />
            <button onClick={(e) => { e.preventDefault(); handleNextMonth(); }} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {weekDays.map((day, idx) => (
              <span key={idx} className="text-xs font-bold text-slate-400 mb-2">{day}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-2 place-items-center">
            {renderDays()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};