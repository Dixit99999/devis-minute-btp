import type { Quote, ArtisanProfile } from '../types';

export interface WhatsAppShareOptions {
  quote: {
    number: string;
    totalTTC: number;
    totalHT?: number;
    depositAmountTTC?: number;
    depositPercent?: number;
    partage_token?: string;
    id?: string;
  } | Quote;
  artisan: {
    companyName: string;
    phone?: string;
    artisanName?: string;
  } | ArtisanProfile;
  clientPhone?: string;
  clientName?: string;
  format?: 'short' | 'detailed';
  baseUrl?: string;
}

/**
 * Nettoie et formate un numéro de téléphone pour le lien wa.me (ex: "06 12 34 56 78" -> "33612345678")
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9+]/g, '');
  if (digits.startsWith('+')) {
    return digits.substring(1);
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `33${digits.substring(1)}`;
  }
  return digits;
}

/**
 * Génère l'URL publique de consultation et de signature pour le client
 */
export function getPublicQuoteUrl(tokenOrId: string, baseUrl?: string): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://devis-minute-btp.vercel.app');
  return `${origin}/?signToken=${tokenOrId}`;
}

/**
 * Génère le message texte optimisé pour WhatsApp
 */
export function generateWhatsAppQuoteMessage(options: WhatsAppShareOptions): string {
  const { quote, artisan, clientName, format = 'short', baseUrl } = options;
  const token = ('partage_token' in quote && quote.partage_token) || quote.id || '';
  const signUrl = getPublicQuoteUrl(token, baseUrl);
  const clientSalutation = clientName && clientName.trim() ? `Bonjour ${clientName.trim()}` : 'Bonjour';
  const company = artisan.companyName || 'Votre artisan';

  if (format === 'short') {
    return (
      `${clientSalutation},\n\n` +
      `Voici votre devis officiel n° ${quote.number} pour un montant de ${quote.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € TTC.\n\n` +
      `✍️ Vous pouvez le consulter et le signer directement au doigt sur votre smartphone ici :\n` +
      `${signUrl}\n\n` +
      `Restant à votre entière disposition,\n` +
      `${company}`
    );
  }

  // Format détaillé
  const depositAmount = 'depositAmountTTC' in quote ? quote.depositAmountTTC : 0;
  const depositPercent = 'depositPercent' in quote ? quote.depositPercent : 30;

  const depositText = depositAmount && depositAmount > 0
    ? `\n💳 Acompte demandé : ${depositAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € TTC (${depositPercent}%)`
    : '';

  const artisanContactName = 'artisanName' in artisan ? artisan.artisanName : company;

  return (
    `📋 *${company.toUpperCase()} - DEVIS N° ${quote.number}*\n\n` +
    `${clientSalutation},\n\n` +
    `Veuillez trouver les détails de notre proposition :\n` +
    `• Montant total : *${quote.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € TTC*` +
    depositText + `\n\n` +
    `👉 *Consultation & Signature instantanée :*\n` +
    `${signUrl}\n\n` +
    `Une fois signé, votre exemplaire PDF officiel vous sera immédiatement mis à disposition.\n\n` +
    `Bien cordialement,\n` +
    `${artisanContactName}\n` +
    (artisan.phone ? `📞 ${artisan.phone}` : '')
  );
}

/**
 * Construit le lien direct wa.me avec le numéro du client et le message pré-rempli
 */
export function buildWhatsAppLink(options: WhatsAppShareOptions): string {
  const cleanPhone = formatPhoneForWhatsApp(options.clientPhone || '');
  const message = generateWhatsAppQuoteMessage(options);
  const encodedMessage = encodeURIComponent(message);
  
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Ouvre directement l'application WhatsApp ou WhatsApp Web
 */
export function openWhatsAppQuote(options: WhatsAppShareOptions): void {
  const link = buildWhatsAppLink(options);
  if (typeof window !== 'undefined') {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
}

export default {
  formatPhoneForWhatsApp,
  getPublicQuoteUrl,
  generateWhatsAppQuoteMessage,
  buildWhatsAppLink,
  openWhatsAppQuote,
};
