import React, { useState } from 'react';
import type { ArtisanProfile } from '../types';
import {
  ArrowRight,
  Check,
  Flame,
  Zap,
  Lock,
  Paintbrush,
  Snowflake,
  DoorOpen,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';


interface OnboardingModalProps {
  initialProfile: ArtisanProfile;
  onComplete: (profile: ArtisanProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState<ArtisanProfile>({
    ...initialProfile,
    defaultHourlyRate: initialProfile.defaultHourlyRate || 60,
  });

  const trades = [
    { id: 'plomberie', label: 'Plomberie & Chauffage', icon: Flame, defaultRate: 65 },
    { id: 'electricite', label: 'Électricité Générale', icon: Zap, defaultRate: 60 },
    { id: 'serrurerie', label: 'Serrurerie & Dépannage', icon: Lock, defaultRate: 70 },
    { id: 'peinture', label: 'Peinture & Rénovation', icon: Paintbrush, defaultRate: 50 },
    { id: 'climatisation', label: 'Climatisation & PAC', icon: Snowflake, defaultRate: 70 },
    { id: 'menuiserie', label: 'Menuiserie & Agencement', icon: DoorOpen, defaultRate: 55 },
  ];

  const handleSelectTrade = (tradeLabel: string, defaultRate: number) => {
    setProfile((prev) => ({
      ...prev,
      trade: tradeLabel,
      defaultHourlyRate: defaultRate,
    }));
    setStep(2);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    onComplete({
      ...profile,
      isOnboarded: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* En-tête progression */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-bold text-amber-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Configuration Express (60 secondes)
          </div>
          <h2 className="text-base font-black text-white">
            {step === 1 && "Quel est votre métier principal ?"}
            {step === 2 && "Votre Entreprise & Contact"}
            {step === 3 && "Taux Horaire & Décennale"}
          </h2>
          <div className="flex justify-center gap-1.5 mt-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-amber-500'
                    : s < step
                    ? 'w-4 bg-emerald-500'
                    : 'w-4 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contenu selon étape */}
        <div className="p-5">
          {step === 1 && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-400 text-center mb-3">
                Nous préparons votre catalogue d'ouvrages et vos tarifs types sur-mesure.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {trades.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTrade(t.label, t.defaultRate)}
                      className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-left transition flex items-center gap-3 group"
                    >
                      <div className="p-2 bg-slate-700 group-hover:bg-amber-500/20 group-hover:text-amber-400 rounded-xl text-slate-300 transition">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                          {t.label}
                        </p>
                        <p className="text-[10px] text-slate-400">~{t.defaultRate}€ HT / heure</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Nom Commercial / Raison Sociale
                </label>
                <input
                  type="text"
                  placeholder="Ex: SARL Bâti Express"
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Votre Nom & Prénom
                </label>
                <input
                  type="text"
                  placeholder="Ex: Marc Fontaine"
                  value={profile.artisanName}
                  onChange={(e) => setProfile({ ...profile, artisanName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Numéro SIRET
                  </label>
                  <input
                    type="text"
                    placeholder="14 chiffres"
                    value={profile.siret}
                    onChange={(e) => setProfile({ ...profile, siret: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Téléphone Mobile
                  </label>
                  <input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow glow-amber flex items-center justify-center gap-1.5"
                >
                  Continuer <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleFinish} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Votre Taux Horaire Moyen HT (€ / heure)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={profile.defaultHourlyRate}
                    onChange={(e) => setProfile({ ...profile, defaultHourlyRate: parseFloat(e.target.value) || 0 })}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center font-bold focus:border-amber-400 outline-none"
                    required
                  />
                  <span className="text-xs text-slate-400 font-semibold">€ HT / h</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Compagnie d'Assurance Décennale
                </label>
                <input
                  type="text"
                  placeholder="Ex: SMABTP, AXA Pro, MAAF, Allianz"
                  value={profile.decennaleCompany}
                  onChange={(e) => setProfile({ ...profile, decennaleCompany: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Numéro de Police Décennale
                </label>
                <input
                  type="text"
                  placeholder="Ex: DEC-2026-984210"
                  value={profile.decennalePoliceNumber}
                  onChange={(e) => setProfile({ ...profile, decennalePoliceNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg glow-amber flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Créer mon premier devis
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
