import React, { useState } from 'react';
import type { Quote, ArtisanProfile } from '../types';
import { formatEuro } from '../utils/calculator';
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  CheckCircle,
  ShieldCheck,
  Copy,
  Check,
  Banknote,
  Send,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  quote: Quote;
  artisan: ArtisanProfile;
  onPaymentSuccess: (quoteId: string) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  quote,
  artisan,
  onPaymentSuccess,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'sms' | 'card' | 'manual'>('qr');
  const [manualType, setManualType] = useState<'especes' | 'cheque' | 'virement'>('especes');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(quote.status === 'acompte_paye');

  // Simulation formulaire CB
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  const paymentUrl = `https://pay.devisminute-btp.fr/pay/${quote.id}?montant=${encodeURIComponent(quote.depositAmountTTC)}&client=${encodeURIComponent(quote.client.name || 'Client')}&devis=${encodeURIComponent(quote.number)}`;

  // QR Code dynamique haute définition via QR server API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentUrl)}&bgcolor=ffffff&color=020617&margin=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendPaymentSMS = () => {
    const text = encodeURIComponent(
      `Bonjour ${quote.client.name || ''},\n\nVoici votre lien sécurisé pour régler l'acompte de ${formatEuro(quote.depositAmountTTC)} pour votre devis ${quote.number} (${artisan.companyName}) :\n${paymentUrl}`
    );
    window.open(`sms:${quote.client.phone}?body=${text}`, '_blank');
  };

  const handleSendPaymentWhatsApp = () => {
    const text = encodeURIComponent(
      `Bonjour ${quote.client.name || ''},\n\nVoici le lien de règlement sécurisé par Carte Bancaire / Apple Pay pour l'acompte de ${formatEuro(quote.depositAmountTTC)} sur votre devis ${quote.number} (${artisan.companyName}) :\n${paymentUrl}`
    );
    const phone = quote.client.phone.replace(/[\s.-]/g, '');
    const cleanPhone = phone.startsWith('0') ? '33' + phone.substring(1) : phone;
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleValidatePayment = (_methodLabel: string = 'Carte Bancaire') => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
      onPaymentSuccess(quote.id);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Règlement de l'Acompte Chantier
              </h3>
              <p className="text-[10px] text-slate-400">
                Devis {quote.number} • {quote.client.name || 'Client'}
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

        {/* Content Scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          {/* Bloc Montant de l'acompte */}
          <div className="bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
              Montant de l'Acompte ({quote.depositPercent}% à la signature)
            </span>
            <div className="text-3xl font-mono font-black text-amber-400">
              {formatEuro(quote.depositAmountTTC)}
            </div>
            <p className="text-[11px] text-slate-400">
              Total du devis : {formatEuro(quote.totalTTC)} TTC • Solde restant : {formatEuro(quote.totalTTC - quote.depositAmountTTC)} TTC
            </p>
          </div>

          {isPaid ? (
            /* Écran de Succès */
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-400">Acompte Encaissé avec Succès !</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Le chantier est désormais verrouillé et confirmé. La facture d'acompte correspondante est prête.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow"
                >
                  Fermer & Continuer
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Onglets Méthodes */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('qr')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                    selectedMethod === 'qr'
                      ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                    selectedMethod === 'card'
                      ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Terminal CB</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('sms')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                    selectedMethod === 'sms'
                      ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Lien SMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('manual')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                    selectedMethod === 'manual'
                      ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Espèces / Autre</span>
                </button>
              </div>

              {/* Vue 1 : Scan QR Code Smartphone */}
              {selectedMethod === 'qr' && (
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-center space-y-3 animate-in fade-in">
                  <p className="text-slate-300 font-medium text-xs">
                    Présentez cet écran à votre client pour qu'il scanne le QR code avec l'appareil photo de son smartphone :
                  </p>

                  <div className="p-3 bg-white rounded-2xl inline-block shadow-2xl mx-auto border-4 border-amber-400/30">
                    <img
                      src={qrCodeImageUrl}
                      alt="QR Code Paiement Acompte"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Paiement sécurisé 3D-Secure • Apple Pay / Google Pay / CB</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleValidatePayment('QR Code')}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {isProcessing ? 'Validation...' : 'Confirmer la réception du scan'}
                  </button>
                </div>
              )}

              {/* Vue 2 : Terminal Virtuel CB / Apple Pay */}
              {selectedMethod === 'card' && (
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Paiement par Carte sur l'écran</span>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                      <Lock className="w-3 h-3" /> Chiffré Stripe 256-bit
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Numéro de carte</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Date Expiration</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center focus:border-amber-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">CVC</label>
                        <input
                          type="password"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center focus:border-amber-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleValidatePayment('Carte Bancaire')}
                    disabled={isProcessing}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg glow-amber transition flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isProcessing ? 'Débit en cours...' : `Débiter ${formatEuro(quote.depositAmountTTC)} TTC`}
                  </button>
                </div>
              )}

              {/* Vue 3 : Envoi du lien par SMS / WhatsApp */}
              {selectedMethod === 'sms' && (
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in">
                  <p className="text-slate-300">
                    Transmettez le lien de paiement direct au client :
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSendPaymentWhatsApp}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <Smartphone className="w-4 h-4" />
                      Lien WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={handleSendPaymentSMS}
                      className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <Send className="w-4 h-4" />
                      Lien SMS
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      readOnly
                      value={paymentUrl}
                      className="bg-transparent text-[11px] text-slate-400 font-mono flex-1 outline-none truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 transition shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                </div>
              )}

              {/* Vue 4 : Encaissement Manuel (Espèces / Chèque / Virement) */}
              {selectedMethod === 'manual' && (
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in">
                  <span className="font-bold text-white text-xs block">
                    Mode de règlement physique reçu sur place :
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'especes', label: '💶 Espèces' },
                      { id: 'cheque', label: '✍️ Chèque' },
                      { id: 'virement', label: '🏦 Virement' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setManualType(m.id as any)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                          manualType === m.id
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleValidatePayment(manualType)}
                    disabled={isProcessing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isProcessing ? 'Enregistrement...' : `Encaissé (${formatEuro(quote.depositAmountTTC)})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[10px] text-slate-500">
            {artisan.companyName} • SIRET {artisan.siret}
          </span>
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

