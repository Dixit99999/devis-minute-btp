import React, { useState } from 'react';
import { X, Check, Zap, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
}) => {

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'solo' | 'pro'>('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setIsProcessing(true);
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
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-xl text-slate-950">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Formules & Abonnements Pro</h3>
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
        <div className="p-5 space-y-4">
          {/* Toggle Mensuel / Annuel */}
          <div className="flex justify-center">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  billingCycle === 'monthly' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
                  billingCycle === 'yearly' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Annuel <span className="text-[10px] bg-emerald-500 text-slate-950 px-1 rounded font-black">-20%</span>
              </button>
            </div>
          </div>

          {/* Cartes Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Plan Solo */}
            <div
              onClick={() => setSelectedPlan('solo')}
              className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                selectedPlan === 'solo'
                  ? 'bg-slate-850 border-amber-500 ring-1 ring-amber-500'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Solo</span>
                <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                  {billingCycle === 'monthly' ? (
                    <>
                      <span className="text-2xl font-mono font-black text-white">39 €</span>
                      <span className="text-xs text-slate-400 font-medium">/ mois HT</span>
                    </>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-black text-white">372 €</span>
                        <span className="text-xs text-slate-400 font-medium">/ an HT</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        (soit 31 € / mois • 2 mois offerts)
                      </span>
                    </div>
                  )}
                </div>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Devis & Factures illimités
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Signature tactile client
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Export PDF conforme BTP
                  </li>
                </ul>
              </div>
            </div>

            {/* Plan Pro (Recommandé) */}
            <div
              onClick={() => setSelectedPlan('pro')}
              className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between relative ${
                selectedPlan === 'pro'
                  ? 'bg-gradient-to-br from-amber-500/10 to-slate-850 border-amber-500 ring-2 ring-amber-500 shadow-xl glow-amber'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Recommandé
              </div>
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Pro Artisan</span>
                <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                  {billingCycle === 'monthly' ? (
                    <>
                      <span className="text-2xl font-mono font-black text-amber-400">59 €</span>
                      <span className="text-xs text-slate-400 font-medium">/ mois HT</span>
                    </>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-black text-amber-400">564 €</span>
                        <span className="text-xs text-slate-400 font-medium">/ an HT</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        (soit 47 € / mois • 2 mois offerts)
                      </span>
                    </div>
                  )}
                </div>
                <ul className="mt-3 space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-1.5 font-semibold">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Tout le plan Solo +
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Encaissement d'acompte CB en ligne
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Relances SMS automatiques
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Annexe photos de chantier
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Abonnement */}
          {subscribed ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs font-bold text-emerald-400">
              🎉 Abonnement activé ! Vous bénéficiez de toutes les fonctionnalités Pro.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg glow-amber transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {isProcessing
                ? 'Connexion sécurisée Stripe...'
                : billingCycle === 'yearly'
                  ? `Démarrer mes 14 jours d'essai (${selectedPlan === 'pro' ? '564€/an • soit 47€/m' : '372€/an • soit 31€/m'})`
                  : `Démarrer mes 14 jours d'essai (${selectedPlan === 'pro' ? '59€/mois' : '39€/mois'})`}
            </button>
          )}

          <p className="text-[11px] text-slate-500 text-center">
            Paiement sécurisé par Stripe • Annulation en 1 clic à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
};
