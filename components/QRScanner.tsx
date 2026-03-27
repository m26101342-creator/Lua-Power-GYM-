import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Stop scanner to avoid multiple scans
        scanner.clear().catch(console.error);
        onScan(decodedText);
      },
      (errorMessage) => {
        // Ignore scanning errors
      }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Escanear QR Code</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div id="qr-reader" className="w-full rounded-2xl overflow-hidden bg-slate-50"></div>
          <p className="text-center text-slate-500 text-sm mt-4">
            Aponte a câmera para o QR Code do aluno para realizar o check-in.
          </p>
        </div>
      </div>
    </div>
  );
};
