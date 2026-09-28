import React, { useState } from 'react';
import type { ArtisanProfile } from '../types';
import { Shield, Building2, Phone, Check, Save } from 'lucide-react';

interface ArtisanSettingsProps {
  profile: ArtisanProfile;
  onSave: (updatedProfile: ArtisanProfile) => void;
}

export const ArtisanSettings: React.FC<ArtisanSettingsProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState<ArtisanProfile>(profile);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof ArtisanProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Paramètres & Coordonnées Artisan</h2>
          <p className="text-xs text-slate-400">Ces informations figurent obligatoirement sur vos devis et factures</p>
        </div>
        {saved && (
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" /> Enregistré !
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identité Entreprise */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            Entreprise & Activité
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Nom commercial / Raison sociale</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Nom & Prénom de l'artisan</label>
              <input
                type="text"
                value={formData.artisanName}
                onChange={(e) => handleChange('artisanName', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Corps d'état / Métier principal</label>
              <input
                type="text"
                value={formData.trade}
                onChange={(e) => handleChange('trade', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                placeholder="Ex: Plombier Chauffagiste, Électricien"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Numéro SIRET (14 chiffres)</label>
              <input
                type="text"
                value={formData.siret}
                onChange={(e) => handleChange('siret', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Numéro TVA Intracommunautaire</label>
              <input
                type="text"
                value={formData.tvaIntra}
                onChange={(e) => handleChange('tvaIntra', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">RCS / Répertoire des Métiers</label>
              <input
                type="text"
                value={formData.rcsOrRma}
                onChange={(e) => handleChange('rcsOrRma', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact & Adresse */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-400" />
            Contact & Siège Social
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="text-xs font-medium text-slate-400 block mb-1">Adresse</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Code Postal</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-400 block mb-1">Ville</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Téléphone Mobile</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-400 block mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Assurance Décennale & RCP Obligatoire BTP */}
        <div className="glass-card p-5 rounded-2xl space-y-4 border-amber-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Garantie Décennale & RCP (Loi Pinel BTP)
            </h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              Mention Légale Obligatoire
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Compagnie d'assurance</label>
              <input
                type="text"
                value={formData.decennaleCompany}
                onChange={(e) => handleChange('decennaleCompany', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                placeholder="Ex: SMABTP, AXA, MAAF Pro"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Numéro de police de contrat</label>
              <input
                type="text"
                value={formData.decennalePoliceNumber}
                onChange={(e) => handleChange('decennalePoliceNumber', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl flex items-center gap-2 shadow-lg glow-amber transition"
          >
            <Save className="w-4 h-4" />
            Enregistrer les informations
          </button>
        </div>
      </form>
    </div>
  );
};
