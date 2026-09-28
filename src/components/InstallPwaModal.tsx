import React, { useState, useEffect } from 'react';
import {
  Download,
  Share,
  PlusSquare,
  X,
  Smartphone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Détection iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Détection mode standalone (déjà installée)
    const isApp = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(Boolean(isApp));

    // Capture de l'événement beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Installer sur votre smartphone
              </h3>
              <p className="text-[10px] text-slate-400">Accès 1-touche & fonctionnement hors-ligne</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-5 space-y-4 text-xs">
          {isStandalone ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-white text-sm">Application déjà installée !</p>
              <p className="text-slate-300 text-xs">
                Vous utilisez actuellement Devis Minute en mode plein écran autonome.
              </p>
            </div>
          ) : isIOS ? (
            /* Guide pour iPhone / iPad */
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <p className="font-bold text-white text-xs">Sur iPhone (Safari) :</p>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-slate-300">
                    Appuyez sur le bouton <strong>Partager</strong> en bas de Safari :
                  </p>
                  <div className="mt-1 inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg text-sky-400 font-semibold text-[11px]">
                    <Share className="w-3.5 h-3.5" /> Icône Partager
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-slate-300">
                    Faites défiler vers le bas et sélectionnez :
                  </p>
                  <div className="mt-1 inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg text-amber-400 font-semibold text-[11px]">
                    <PlusSquare className="w-3.5 h-3.5" /> Sur l'écran d'accueil
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-slate-300">
                    Touchez <strong>Ajouter</strong> en haut à droite. L'icône apparaîtra sur votre écran d'accueil comme une vraie application !
                  </p>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            /* Installation directe Android / Chrome */
            <div className="space-y-4 text-center py-2">
              <p className="text-slate-300">
                Installez <strong>Devis Minute BTP</strong> pour l'ouvrir en plein écran sans barre de navigateur et l'utiliser hors réseau dans vos chantiers.
              </p>
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg glow-amber transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Installer l'application maintenant
              </button>
            </div>
          ) : (
            /* Guide générique */
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-slate-300">
              <p className="font-bold text-white">Dans le menu de votre navigateur :</p>
              <p>
                Ouvrez le menu des options (<strong>⋮</strong> ou <strong>Partager</strong>) et cliquez sur <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
              </p>
            </div>
          )}

          {/* Avantages PWA */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Plein écran natif</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Chiffrage hors-ligne</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
