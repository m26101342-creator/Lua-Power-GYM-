import React from 'react';
import { User } from '../types';
import { X, CheckCircle2, XCircle, Calendar, User as UserIcon, Activity, Pencil } from 'lucide-react';
import { getUserStatus, formatDate } from '../utils/dateUtils';
import { UserStatus } from '../types';
import { useNavigate } from 'react-router-dom';

interface ScannedClientModalProps {
  client: User;
  onClose: () => void;
}

export const ScannedClientModal: React.FC<ScannedClientModalProps> = ({ client, onClose }) => {
  const statusData = getUserStatus(client);
  const navigate = useNavigate();
  const isRegularized = statusData.status === UserStatus.ACTIVE || statusData.status === UserStatus.WARNING;
  const isInactive = statusData.status === UserStatus.INACTIVE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-500" />
            Check-in do Aluno
          </h3>
          <button 
            onClick={onClose}
            className="p-2 bg-white text-slate-500 rounded-full hover:bg-slate-100 transition-colors shadow-sm border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          
          {/* Animation Icon */}
          <div className="mb-6 relative">
            {isInactive ? (
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center animate-pulse">
                <UserIcon className="w-12 h-12 text-slate-400" />
              </div>
            ) : isRegularized ? (
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center animate-pulse">
                <XCircle className="w-16 h-16 text-rose-500" />
              </div>
            )}
          </div>

          {/* Client Info */}
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-1">{client.name}</h2>
          <p className="text-slate-500 text-sm mb-6">{client.email}</p>

          {/* Status Card */}
          <div className="w-full bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Status da Propina</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusData.color}`}>
                {statusData.label}
              </span>
            </div>

            {!isInactive && (
              <>
                <div className="h-px w-full bg-slate-200" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Validade do Plano</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    {client.subscription_end_date ? formatDate(client.subscription_end_date) : 'N/A'}
                  </span>
                </div>
              </>
            )}

            {isInactive && (
              <div className="text-center p-3 bg-slate-100 rounded-xl mt-2">
                <p className="text-sm text-slate-600 font-medium">
                  Aluno não está inscrito em nenhuma aula no momento.
                </p>
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 w-full mt-6">
            <button
              onClick={() => {
                onClose();
                navigate(`/edit/${client.id}`);
              }}
              className="py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Pencil className="w-4 h-4" /> Editar
            </button>
            <button
              onClick={onClose}
              className={`py-3 px-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] ${
                isInactive ? 'bg-slate-800 hover:bg-slate-700' :
                isRegularized ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25' : 
                'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/25'
              }`}
            >
              Concluir
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
