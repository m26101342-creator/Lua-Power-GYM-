import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  type?: 'danger' | 'info' | 'success' | 'warning';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  type = 'info',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getHeaderColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50 text-rose-600';
      case 'warning':
        return 'bg-amber-50 text-amber-600';
      case 'success':
        return 'bg-emerald-50 text-emerald-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${getHeaderColor()}`}>
          <h3 className="font-bold text-lg">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-slate-600">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
