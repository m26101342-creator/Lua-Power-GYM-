import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  status?: 'regular' | 'expired' | null;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, status }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            html5QrCode.stop().then(() => onScan(decodedText)).catch(console.error);
          },
          () => {}
        ).catch((err) => setError("Permissão de câmera negada ou erro."));
      } else {
        setError("Nenhuma câmera encontrada.");
      }
    }).catch(() => setError("Erro ao acessar a câmera."));

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl relative"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">Check-in de Aluno</h3>
          <button onClick={onClose} className="p-2 bg-white text-slate-400 rounded-full hover:bg-slate-100 transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <div id="qr-reader" className="w-full aspect-square rounded-3xl overflow-hidden bg-slate-900 relative">
            <AnimatePresence>
              {status && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 z-10 flex items-center justify-center ${status === 'regular' ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`}
                >
                  {status === 'regular' ? (
                    <CheckCircle className="w-24 h-24 text-white" />
                  ) : (
                    <AlertCircle className="w-24 h-24 text-white" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-6 text-center space-y-2">
            <p className="font-bold text-slate-800">Instruções:</p>
            <p className="text-slate-500 text-sm">
              Posicione o QR Code do aluno dentro da área demarcada para registrar a entrada.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
