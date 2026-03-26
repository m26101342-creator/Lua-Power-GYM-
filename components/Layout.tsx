import React, { useState, useEffect } from 'react';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
  notification?: string | null;
  hideHeader?: boolean;
  fullWidth?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, showBack, onBack, action, notification, hideHeader = false, fullWidth = false }) => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return (
    <div className={`bg-slate-100 flex justify-center ${fullWidth ? 'min-h-screen' : 'lg:items-center lg:min-h-screen lg:py-10'}`}>
      <div className={`
        bg-slate-50 relative flex flex-col shadow-2xl
        ${fullWidth 
          ? 'w-full h-[100dvh] lg:h-auto lg:min-h-screen' 
          : 'w-full max-w-md h-[100dvh] lg:h-[850px] lg:rounded-[2.5rem] lg:overflow-hidden lg:border-[8px] border-slate-200'
        }
      `}>
        
        {/* Top Notification Overlay */}
        {notification && (
          <div className="absolute top-24 left-0 right-0 z-[60] flex justify-center px-6 animate-fade-in pointer-events-none">
            <div className="bg-slate-800/95 backdrop-blur-md text-white py-3 px-5 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center gap-3 border border-slate-700/50 max-w-full">
               <span className="font-semibold text-sm leading-tight text-center">{notification}</span>
            </div>
          </div>
        )}

        {/* Header - Conditionally Rendered */}
        {!hideHeader && (
          <header className={`sticky top-0 z-30 glass-header border-b border-slate-200/50 px-6 py-5 flex items-center justify-between transition-all duration-200 ${fullWidth ? 'lg:px-8' : ''}`}>
            <div className="flex items-center gap-3">
              {showBack ? (
                <button 
                  onClick={onBack || (() => navigate(-1))}
                  className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-600"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              ) : (
                <div className="relative">
                  <img 
                    src="https://i.postimg.cc/K86FS7PH/1000196294_fotor_enhance_20260107104529.jpg" 
                    alt="Lua Power GYM" 
                    className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100" 
                  />
                  {!isOnline && (
                     <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white rounded-full p-1 border-2 border-white shadow-sm" title="Modo Offline">
                       <WifiOff className="w-2.5 h-2.5" />
                     </div>
                  )}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate leading-tight">
                  {title || 'Lua Power GYM'}
                </h1>
                {!isOnline && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Modo Offline</p>
                )}
              </div>
            </div>
            <div>{action}</div>
          </header>
        )}

        {/* Content - with Internal Scroll for Native Feel */}
        <main className={`flex-1 relative overflow-y-auto scroll-smooth overscroll-contain flex flex-col ${hideHeader ? 'bg-white' : ''}`}>
          <div className={`${hideHeader ? 'p-0' : 'p-6 pb-28'} ${fullWidth ? 'lg:p-8 lg:pb-8' : ''} flex-1 flex flex-col`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};