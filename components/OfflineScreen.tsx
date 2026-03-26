import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center lg:items-center lg:py-10">
      <div className="w-full max-w-md bg-white min-h-screen lg:min-h-0 lg:h-[850px] lg:rounded-[2.5rem] lg:shadow-2xl flex flex-col items-center justify-center p-8 text-center border-slate-200 lg:border-[8px] relative overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 opacity-60"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 opacity-60"></div>

        <div className="relative z-10 animate-fade-in flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 shadow-sm">
            <WifiOff className="w-10 h-10 text-slate-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Sem conexão</h2>
          
          <p className="text-slate-500 max-w-[260px] leading-relaxed mb-10">
            Parece que você está offline. Verifique sua internet e tente novamente.
          </p>
          
          <button 
            onClick={() => window.location.reload()}
            className="group relative w-full max-w-[200px] py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all duration-300 overflow-hidden hover:bg-slate-800"
          >
             <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span>Tentar Novamente</span>
             </div>
          </button>
        </div>
      </div>
    </div>
  );
};