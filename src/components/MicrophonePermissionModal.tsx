import React, { useState } from 'react';
import { Mic, ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';


interface MicrophonePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
}

export const MicrophonePermissionModal: React.FC<MicrophonePermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
}) => {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const requestPermission = async () => {
    setStatus('requesting');
    setErrorMessage(null);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Arrêter le flux de test immédiatement
        stream.getTracks().forEach((track) => track.stop());
        setStatus('granted');
        setTimeout(() => {
          onPermissionGranted();
          onClose();
        }, 800);
      } else {
        throw new Error("L'API média audio n'est pas accessible sur ce navigateur.");
      }
    } catch (err: any) {
      console.warn("Permission micro refusée ou non supportée:", err);
      setStatus('denied');
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        setErrorMessage(
          "Sur mobile via Wi-Fi local (HTTP), Chrome peut bloquer l'accès au micro. Activez 'Autoriser le micro' dans les paramètres du site (icône cadenas/paramètres à côté de l'URL)."
        );
      } else {
        setErrorMessage(
          "L'accès au micro a été refusé. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur mobile."
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-md">
          <Mic className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Autorisation du Microphone</h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Pour dicter vos devis oralement sur le chantier en 30 secondes, l'application a besoin d'accéder à votre micro.
          </p>
        </div>

        {status === 'granted' && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Microphone autorisé avec succès !
          </div>
        )}

        {status === 'denied' && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[11px] text-rose-300 text-left space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Microphone bloqué
            </div>
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={requestPermission}
            disabled={status === 'requesting'}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg glow-amber transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {status === 'requesting' ? 'Demande en cours...' : 'Autoriser le Microphone'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium text-xs rounded-xl transition"
          >
            Fermer / Utiliser le clavier
          </button>
        </div>
      </div>
    </div>
  );
};
