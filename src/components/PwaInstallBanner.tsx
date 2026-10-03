import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si déjà en mode standalone (déjà installée)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Détection iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Vérifier si l'artisan a déjà masqué la bannière récemment
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    if (isDismissed) setDismissed(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => setDismissed(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // Ne pas afficher si déjà installée en plein écran ou si masquée
  if (isStandalone || dismissed) return null;
  // N'afficher que si on a le prompt ou si on est sur iOS (et pas encore installé)
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="font-bold text-white text-xs truncate">
              Installez <span className="text-amber-400">Devis Minute BTP</span> sur votre écran
            </p>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Accès immédiat 1-clic sur chantier & fonctionnement hors-ligne
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {installed ? (
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Installée !
            </span>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow glow-amber transition"
            >
              <Download className="w-3.5 h-3.5" />
              Installer l'app
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Masquer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal d'instructions pour iPhone / iPad */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl border border-amber-500/30 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Installer sur iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Pour ajouter l'application sur votre écran d'accueil comme une vraie application :
            </p>

            <ol className="space-y-3 text-xs text-slate-200">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>
                  Appuyez sur le bouton <strong>Partager</strong> <Share className="w-3.5 h-3.5 inline text-sky-400 ml-1" /> en bas de l'écran dans Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>
                  Faites défiler vers le bas et sélectionnez <strong>« Sur l'écran d'accueil »</strong> <PlusSquare className="w-3.5 h-3.5 inline text-amber-400 ml-1" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>
                  Appuyez sur <strong>Ajouter</strong> en haut à droite. L'icône apparaîtra sur votre téléphone !
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition mt-2"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
