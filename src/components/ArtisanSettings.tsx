import React, { useState } from 'react';
import type { ArtisanProfile } from '../types';
import { Shield, Building2, Phone, Check, Save, CreditCard, Clock, Euro } from 'lucide-react';

interface ArtisanSettingsProps {
  profile: ArtisanProfile;
  onSave: (updatedProfile: ArtisanProfile) => void;
}

export const ArtisanSettings: React.FC<ArtisanSettingsProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState<ArtisanProfile>(profile);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof ArtisanProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const hourlyRatePresets = [45, 50, 55, 60, 65, 70, 75, 85];

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
        {/* Section Tarification & Taux horaire */}
        <div className="glass-card p-5 rounded-2xl space-y-4 border-amber-500/30 bg-gradient-to-br from-slate-900/90 to-amber-950/20 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Tarification & Taux horaire de Main-d'œuvre
            </h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
              Référence Dictée & Devis
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Définissez votre tarif horaire de base. Il sera automatiquement appliqué lors de la dictée vocale IA, des boutons d'ajout rapide (<span className="text-amber-400 font-bold">+1h</span>, <span className="text-amber-400 font-bold">+2h</span>) et pour vos chiffrages de pose.
          </p>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Euro className="w-4 h-4 text-amber-400" />
                Taux horaire par défaut (€ HT / heure) :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="20"
                  max="300"
                  step="1"
                  value={formData.defaultHourlyRate || 60}
                  onChange={(e) => handleChange('defaultHourlyRate', Number(e.target.value) || 0)}
                  className="w-28 bg-slate-900 border-2 border-amber-500/60 rounded-xl px-3 py-2 text-base font-black text-amber-400 text-center font-mono focus:border-amber-400 outline-none shadow-inner"
                  required
                />
                <span className="text-xs font-bold text-slate-400">€ HT / h</span>
              </div>
            </div>

            {/* Presets rapides de taux horaire */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Sélection rapide :</span>
              {hourlyRatePresets.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleChange('defaultHourlyRate', rate)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    formData.defaultHourlyRate === rate
                      ? 'bg-amber-500 text-slate-950 shadow-md glow-amber'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {rate} €/h
                </button>
              ))}
            </div>
          </div>
        </div>

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

        {/* Coordonnées Bancaires (RIB / IBAN / BIC) */}
        <div className="glass-card p-5 rounded-2xl space-y-4 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Coordonnées Bancaires (Paiement par Virement & Facturation)
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
              Pied de Facture
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Ces coordonnées apparaîtront en bas de vos factures pour permettre à vos clients de régler leur acompte ou solde par virement bancaire.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-400 block mb-1">IBAN (Format Français)</label>
              <input
                type="text"
                value={formData.ribIban || ''}
                onChange={(e) => handleChange('ribIban', e.target.value)}
                placeholder="FR76 3000 4000 0100 0123 4567 890"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Code BIC / SWIFT</label>
              <input
                type="text"
                value={formData.ribBic || ''}
                onChange={(e) => handleChange('ribBic', e.target.value)}
                placeholder="BNPAFRPP"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section Notifications & Alertes Signature Client */}
        <div className="glass-card p-5 rounded-2xl space-y-4 border-blue-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-400" />
              Alertes & Notifications de Signature en Direct
            </h3>
            <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-semibold">
              Temps Réel
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Soyez averti instantanément sur votre téléphone dès qu'un client valide et signe son devis à distance.
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sendSmsOnSign ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, sendSmsOnSign: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-200 font-medium">
                M'alerter par <strong>SMS instantané</strong> dès qu'un devis est validé et signé
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sendEmailOnSign ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, sendEmailOnSign: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-200 font-medium">
                M'envoyer une notification par <strong>Email</strong> avec la copie PDF signée
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Mobile pour alertes SMS</label>
              <input
                type="tel"
                value={formData.notificationPhone || formData.phone}
                onChange={(e) => handleChange('notificationPhone', e.target.value)}
                placeholder="Ex: 06 12 34 56 78"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Email pour alertes directes</label>
              <input
                type="email"
                value={formData.notificationEmail || formData.email}
                onChange={(e) => handleChange('notificationEmail', e.target.value)}
                placeholder="Ex: contact@artisan.fr"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Webhook URL (Optionnel - Zapier / Make / n8n)</label>
            <input
              type="url"
              value={formData.webhookUrl || ''}
              onChange={(e) => handleChange('webhookUrl', e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-400 outline-none"
            />
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
