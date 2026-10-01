import React, { useState } from 'react';
import type { Quote, ArtisanProfile } from '../types';
import { formatEuro, groupItemsByRoom } from '../utils/calculator';
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
  FileText,
  AlignLeft,
} from 'lucide-react';

interface ShareModalProps {
  quote: Quote;
  artisan: ArtisanProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenPreview?: () => void;
  onOpenClientSign?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  quote,
  artisan,
  isOpen,
  onClose,
  onOpenPreview,
  onOpenClientSign,
}) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(quote.client.phone || '');
  const [customEmail, setCustomEmail] = useState(quote.client.email || '');
  const [shareFormat, setShareFormat] = useState<'detailed' | 'short'>('detailed');

  if (!isOpen) return null;

  const docTypeLabel =
    quote.docType === 'facture_acompte'
      ? "FACTURE D'ACOMPTE"
      : quote.docType === 'facture_solde'
      ? 'FACTURE DE SOLDE'
      : quote.docType === 'avoir'
      ? 'FACTURE D\'AVOIR'
      : 'DEVIS OFFICIEL';

  const docNumber = quote.invoiceNumber || quote.creditNoteNumber || quote.number;
  const clientName = quote.client.name ? quote.client.name.trim() : 'Madame, Monsieur';

  const liveSignUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?sign=${quote.id}`
    : `https://devis-minute-btp.vercel.app/?sign=${quote.id}`;

  // 1. GÉNÉRATION DU DEVIS COMPLET INTÉGRAL (Ligne par ligne)
  const generateDetailedText = () => {
    const grouped = groupItemsByRoom(quote.items);
    let itemsText = '';

    Object.entries(grouped).forEach(([room, data]) => {
      itemsText += `\n📍 ${room.toUpperCase()} :\n`;
      data.items.forEach((item) => {
        const qtyUnit = `${item.quantity} ${item.unit}`;
        itemsText += `  • ${item.designation} (${qtyUnit} x ${formatEuro(item.unitPriceHT)} HT) = ${formatEuro(item.totalHT)} HT (TVA ${item.vatRate}%)\n`;
      });
      itemsText += `  Sous-total ${room} : ${formatEuro(data.totalTTC)} TTC\n`;
    });

    const signatureStatus =
      quote.status === 'signe' || quote.status === 'acompte_paye'
        ? `✅ Document validé et signé électroniquement le ${quote.signedAt || quote.createdAt}`
        : `⏳ Devis en attente de validation • Valable jusqu'au ${quote.validUntil}\n✍️ VALIDER & SIGNER EN LIGNE (sur votre smartphone) :\n👉 ${liveSignUrl}`;

    const depositText =
      quote.depositPercent > 0
        ? `\n💳 Acompte demandé (${quote.depositPercent}%) : ${formatEuro(quote.depositAmountTTC)} TTC`
        : '';

    const ribText = artisan.ribIban
      ? `\n🏦 Règlement par Virement :\nIBAN : ${artisan.ribIban} • BIC : ${artisan.ribBic || ''}`
      : '';

    return `📄 ${docTypeLabel} N° ${docNumber}
Entreprise : ${artisan.companyName}
Client : ${clientName}
Date : ${quote.createdAt}

${signatureStatus}
------------------------------------
🛠️ DÉTAIL COMPLET DES PRESTATIONS :${itemsText}
------------------------------------
💰 RÉCAPITULATIF FINANCIER :
• Total Hors Taxes (HT) : ${formatEuro(quote.totalHT)}
• TVA Totale : ${formatEuro(quote.totalTVA)}
• TOTAL NET À PAYER (TTC) : ${formatEuro(quote.totalTTC)}${depositText}
------------------------------------
🏢 COORDONNÉES & MENTIONS LÉGALES :
${artisan.companyName}
${artisan.address}, ${artisan.postalCode} ${artisan.city}
Tél : ${artisan.phone} • Email : ${artisan.email}
SIRET : ${artisan.siret}
Garantie Décennale : ${artisan.decennaleCompany} (Police N° ${artisan.decennalePoliceNumber})${ribText}

Merci de votre confiance.`;
  };

  // 2. GÉNÉRATION DU MESSAGE SYNTHÉTIQUE
  const generateShortText = () => {
    return quote.status === 'signe' || quote.status === 'acompte_paye'
      ? `Bonjour ${clientName},\n\nVotre ${docTypeLabel.toLowerCase()} n°${docNumber} d'un montant de ${formatEuro(quote.totalTTC)} TTC a bien été validé et signé.\n\nEntreprise : ${artisan.companyName} (${artisan.phone})\nMerci de votre confiance.`
      : `Bonjour ${clientName},\n\nVeuillez trouver votre ${docTypeLabel.toLowerCase()} n°${docNumber} d'un montant de ${formatEuro(quote.totalTTC)} TTC pour vos travaux.\n\n✍️ Vous pouvez le consulter, le valider et le signer au doigt sur votre smartphone ici :\n👉 ${liveSignUrl}\n\nEntreprise : ${artisan.companyName}\nTéléphone : ${artisan.phone}\nValidité : jusqu'au ${quote.validUntil}\n\nRestant à votre entière disposition.`;
  };

  const messageText = shareFormat === 'detailed' ? generateDetailedText() : generateShortText();

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
    const body = encodeURIComponent(messageText);
    window.open(`mailto:${customEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  // 4. Partage Natif Mobile (Web Share API)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${docTypeLabel} N°${docNumber} - ${artisan.companyName}`,
          text: messageText,
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
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Envoyer le Devis Entier au Client
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

        {/* Corps Scrollable */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto custom-scrollbar">
          
          {/* Sélecteur de Format : Devis Complet Intégral vs Message Court */}
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShareFormat('detailed')}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
                shareFormat === 'detailed'
                  ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Devis Entier Détaillé (Ligne par ligne)
            </button>
            <button
              type="button"
              onClick={() => setShareFormat('short')}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                shareFormat === 'short'
                  ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              Court
            </button>
          </div>

          {/* Destinataire rapide */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">N° Téléphone Client</label>
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Email Client</label>
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
              Partager via le Menu Mobile (Messages, WhatsApp, Mail, etc.)
            </button>
          )}

          {/* Grille des canaux d'envoi 1-Clic */}
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
              <span className="text-[11px] font-black">WhatsApp</span>
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
              <span className="text-[11px] font-black">SMS Entier</span>
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
              <span className="text-[11px] font-black">Email Pro</span>
            </button>
          </div>

          {/* Encadré Dédié : Lien de Signature Client Autonome */}
          <div className="bg-slate-950/80 border border-amber-500/40 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Lien Direct Signature Client (Smartphone)
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(liveSignUrl);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
              >
                {linkCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {linkCopied ? 'Lien copié !' : 'Copier le lien'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={liveSignUrl}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 font-mono outline-none"
              />
              {onOpenClientSign && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenClientSign();
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs whitespace-nowrap shadow glow-amber transition"
                  title="Simuler ce que voit le client sur son smartphone"
                >
                  Tester vue client
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              💡 Le client ouvre ce lien sur son téléphone, signe au doigt et valide en 5 secondes. Vous êtes immédiatement notifié.
            </p>
          </div>

          {/* Aperçu Complet du Message & Copie Presse-papier */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold text-amber-400">Contenu intégral du devis envoyé :</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copié !' : 'Copier tout le devis'}
              </button>
            </div>
            <textarea
              readOnly
              rows={8}
              value={messageText}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 outline-none resize-none font-mono leading-relaxed custom-scrollbar"
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
              Télécharger le PDF A4
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
