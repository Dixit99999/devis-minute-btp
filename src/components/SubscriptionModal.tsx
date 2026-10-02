import React, { useState } from 'react';
import { X, Check, Zap, CreditCard, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userEmail: _userEmail,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setIsProcessing(true);
    // Simulation / Redirection Stripe Checkout
    setTimeout(() => {
      setIsProcessing(false);
      setSubscribed(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-xl text-slate-950 shadow glow-amber">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Forfait Pro Artisan</h3>
              <p className="text-xs text-slate-400">14 jours d'essai offerts • Sans engagement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Toggle Mensuel / Annuel */}
          <div className="flex justify-center">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  billingCycle === 'monthly' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mensuel (59 €/m)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
                  billingCycle === 'yearly' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Annuel <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-black">-20%</span>
              </button>
            </div>
          </div>

          {/* Carte Unique Pro Artisan */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-850 to-slate-900 border-2 border-amber-500/50 shadow-xl glow-amber space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Offre Tout Compris
                </span>
                <h4 className="text-base font-black text-white mt-0.5">Accès Illimité Artisan</h4>
              </div>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                14j Gratuits
              </span>
            </div>

            <div className="pt-1 border-t border-slate-800">
              {billingCycle === 'monthly' ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-mono font-black text-amber-400">59 €</span>
                  <span className="text-xs text-slate-400 font-medium">HT / mois (sans engagement)</span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-mono font-black text-amber-400">564 €</span>
                    <span className="text-xs text-slate-400 font-medium">HT / an</span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    Soit 47 € / mois • 2 mois offerts (144 € d'économie)
                  </p>
                </div>
              )}
            </div>

            <ul className="space-y-2.5 text-xs text-slate-200">
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Devis & Factures illimités</strong> avec TVA conforme BTP</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Dictée vocale IA</strong> sur chantier sans restriction</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Signature tactile client</strong> sur smartphone / à distance</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Encaissement d'acompte CB</strong> & QR Code Stripe immédiat</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Mode Chantier 100% Hors-ligne</strong> permanent</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Export Comptable & FEC</strong> conforme DGFIP</span>
              </li>
            </ul>
          </div>

          {/* Action Abonnement */}
          {subscribed ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs font-bold text-emerald-400 animate-in fade-in">
              🎉 Forfait Pro activé ! Merci pour votre confiance.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl glow-amber transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {isProcessing
                ? 'Connexion sécurisée Stripe...'
                : billingCycle === 'yearly'
                  ? "Démarrer l'essai 14j (564 €/an • 47 €/m)"
                  : "Démarrer l'essai 14j (59 €/mois)"}
            </button>
          )}

          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Paiement sécurisé Stripe
            </span>
            <span>•</span>
            <span>Sans engagement</span>
            <span>•</span>
            <span>Frais déductibles</span>
          </div>
        </div>
      </div>
    </div>
  );
};
