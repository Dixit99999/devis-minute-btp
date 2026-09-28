import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <aside aria-label="État de la connexion" className="sticky top-14 z-20 w-full animate-in slide-in-from-top duration-300">
      {!isOnline ? (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-3 py-1.5 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-slate-950 animate-pulse" />
            <span>Mode Hors-ligne (Sous-sol / Sans réseau) : Chiffrage & Signature 100% fonctionnels</span>
          </div>
          <span className="text-[10px] bg-slate-950/20 px-2 py-0.5 rounded-full font-mono">
            Local Actif
          </span>
        </div>
      ) : (
        <div className="bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Connexion rétablie : Toutes vos données sont synchronisées</span>
          </div>
        </div>
      )}
    </aside>
  );
};
