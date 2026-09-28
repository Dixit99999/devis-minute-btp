import React, { useState } from 'react';
import type { Quote, ArtisanProfile } from '../types';
import { formatEuro } from '../utils/calculator';
import {
  X,
  Share2,
  MessageSquare,
  Send,
  Mail,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface ShareModalProps {
  quote: Quote;
  artisan: ArtisanProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenPreview?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  quote,
  artisan,
  isOpen,
  onClose,
  onOpenPreview,
}) => {
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(quote.client.phone || '');
  const [customEmail, setCustomEmail] = useState(quote.client.email || '');

  if (!isOpen) return null;

  const docTypeLabel =
    quote.docType === 'facture_acompte'
      ? "Facture d'acompte"
      : quote.docType === 'facture_solde'
      ? 'Facture de solde'
      : 'Devis';

  const docNumber = quote.invoiceNumber || quote.number;

  // Modèle de message intelligent
  const clientName = quote.client.name ? quote.client.name.trim() : 'Madame, Monsieur';
  const messageText =
    quote.status === 'signe' || quote.status === 'acompte_paye'
      ? `Bonjour ${clientName},\n\nVotre ${docTypeLabel.toLowerCase()} n°${docNumber} d'un montant de ${formatEuro(quote.totalTTC)} TTC a bien été validé et signé.\n\nTravaux : ${artisan.trade}\nEntreprise : ${artisan.companyName} (${artisan.phone})\n\nMerci de votre confiance.`
      : `Bonjour ${clientName},\n\nVeuillez trouver votre ${docTypeLabel.toLowerCase()} n°${docNumber} d'un montant de ${formatEuro(quote.totalTTC)} TTC pour vos travaux.\n\nEntreprise : ${artisan.companyName}\nTéléphone : ${artisan.phone}\nValidité du devis : jusqu'au ${quote.validUntil}\n\nRestant à votre entière disposition.`;

  // Nettoyage téléphone pour WhatsApp
  const cleanPhone = customPhone.replace(/[\s.-]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '33' + cleanPhone.substring(1) : cleanPhone;

  // 1. Partage WhatsApp
  const handleWhatsApp = () => {
    const text = encodeURIComponent(messageText);
    const url = waPhone ? `https://wa.me/${waPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // 2. Partage SMS
  const handleSMS = () => {
    const text = encodeURIComponent(messageText);
    window.open(`sms:${customPhone}?body=${text}`, '_blank');
  };

  // 3. Partage Email (mailto)
  const handleEmail = () => {
    const subject = encodeURIComponent(`${docTypeLabel} N°${docNumber} - ${artisan.companyName}`);
    const body = encodeURIComponent(
      `${messageText}\n\n--------------------\nCoordonnées de l'entreprise :\n${artisan.companyName}\n${artisan.address}, ${artisan.postalCode} ${artisan.city}\nSIRET : ${artisan.siret}\nAssurance Décennale : ${artisan.decennaleCompany} (N° ${artisan.decennalePoliceNumber})`
    );
    window.open(`mailto:${customEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  // 4. Partage Natif Mobile (Web Share API)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${docTypeLabel} N°${docNumber} - ${artisan.companyName}`,
          text: messageText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Partage annulé ou non supporté:', err);
      }
    } else {
      handleCopyText();
    }
  };

  // 5. Copier dans le presse-papier
  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isNativeShareSupported = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Envoyer le document au client
              </h3>
              <p className="text-[10px] text-slate-400">
                {docTypeLabel} n°{docNumber} • {formatEuro(quote.totalTTC)} TTC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Destinataire rapide */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">N° Téléphone</label>
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Email (Optionnel)</label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="client@email.fr"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* Bouton Partage Natif Smartphone (Tiroir iOS / Android) */}
          {isNativeShareSupported && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg glow-amber transition"
            >
              <Smartphone className="w-4 h-4" />
              Menu de Partage Mobile (AirDrop, Messages, etc.)
            </button>
          )}

          {/* Grille des canaux d'envoi */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 shadow transition group"
            >
              <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[11px]">WhatsApp</span>
            </button>

            {/* SMS */}
            <button
              type="button"
              onClick={handleSMS}
              className="p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 shadow transition group"
            >
              <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-[11px]">SMS</span>
            </button>

            {/* Email */}
            <button
              type="button"
              onClick={handleEmail}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 shadow transition group"
            >
              <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[11px]">Email</span>
            </button>
          </div>

          {/* Aperçu du Message & Copie Presse-papier */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Texte pré-rédigé :</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copié !' : 'Copier le texte'}
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={messageText}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 outline-none resize-none font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          {onOpenPreview && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPreview();
              }}
              className="px-3 py-2 text-slate-400 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir le PDF complet
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition ml-auto"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
