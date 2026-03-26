import React, { useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface CustomTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  value: string; // HH:mm
  onChange: (time: string) => void;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ isOpen, onClose, value, onChange }) => {
  const [selectedHour, setSelectedHour] = React.useState('00');
  const [selectedMinute, setSelectedMinute] = React.useState('00');
  
  // Refs for scrolling to selected items could be added here for UX enhancement

  useEffect(() => {
    if (isOpen && value) {
      const [h, m] = value.split(':');
      if (h && m) {
        setSelectedHour(h);
        setSelectedMinute(m);
      }
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  // Generate hours 00-23
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  // Generate minutes 00-55 in steps of 5 for easier selection
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')); 

  const handleConfirm = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-[340px] rounded-[2rem] shadow-2xl relative z-10 animate-fade-in overflow-hidden flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Selecionar Horário</span>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-800">{selectedHour}</span>
                <span className="text-3xl font-extrabold text-slate-300">:</span>
                <span className="text-3xl font-extrabold text-slate-800">{selectedMinute}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Picker Body */}
        <div className="flex-1 overflow-hidden flex divide-x divide-slate-100 h-[300px]">
            {/* Hours */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
                <p className="text-center text-xs font-bold text-slate-400 uppercase mb-4 sticky top-0 bg-white py-1">Horas</p>
                <div className="space-y-2 pb-8">
                    {hours.map(h => (
                        <button 
                            key={h}
                            onClick={() => setSelectedHour(h)}
                            className={`w-full py-3 rounded-xl text-lg font-bold transition-all ${
                                selectedHour === h 
                                ? 'bg-emerald-500 text-white shadow-md' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {h}
                        </button>
                    ))}
                </div>
            </div>

            {/* Minutes */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
                <p className="text-center text-xs font-bold text-slate-400 uppercase mb-4 sticky top-0 bg-white py-1">Minutos</p>
                <div className="space-y-2 pb-8">
                    {minutes.map(m => (
                        <button 
                            key={m}
                            onClick={() => setSelectedMinute(m)}
                            className={`w-full py-3 rounded-xl text-lg font-bold transition-all ${
                                selectedMinute === m 
                                ? 'bg-emerald-500 text-white shadow-md' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center flex-shrink-0">
          <button 
            onClick={handleConfirm}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};