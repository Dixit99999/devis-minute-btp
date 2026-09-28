import React, { useState } from 'react';
import type { Quote, ArtisanProfile } from '../types';
import { formatEuro } from '../utils/calculator';
import { X, CreditCard, QrCode, Smartphone, CheckCircle, ShieldCheck, Copy, Check } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(quote.status === 'acompte_paye');

  const paymentUrl = `https://pay.devisminute-btp.fr/pay/${quote.id}?amount=${quote.depositAmountTTC}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendPaymentSMS = () => {
    const text = encodeURIComponent(
      `Bonjour ${quote.client.name}, voici votre lien sécurisé pour régler l'acompte de ${formatEuro(quote.depositAmountTTC)} pour le devis ${quote.number} de ${artisan.companyName} : ${paymentUrl}`
    );
    window.open(`sms:${quote.client.phone}?body=${text}`, '_blank');
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
      onPaymentSuccess(quote.id);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Encaissement de l'Acompte</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Montant Card */}
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider block mb-1">
              Acompte ({quote.depositPercent} % à la commande)
            </span>
            <div className="text-3xl font-mono font-black text-amber-400">
              {formatEuro(quote.depositAmountTTC)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Devis {quote.number} • Client : {quote.client.name || 'Client'}
            </p>
          </div>

          {isPaid ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-emerald-400">Acompte encaissé avec succès !</h4>
              <p className="text-xs text-slate-300">
                La somme a été créditée. La commande et la réservation du chantier sont verrouillées.
              </p>
            </div>
          ) : (
            <>
              {/* Méthodes d'encaissement */}
              <div className="space-y-3">
                {/* Option 1: QR Code instantané sur le téléphone */}
                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-700 rounded-lg text-amber-400">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Faire scanner le QR Code</p>
                      <p className="text-xs text-slate-400">Le client règle par CB / Apple Pay en 10 sec</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>
                </div>

                {/* Option 2: Envoi par SMS */}
                <button
                  type="button"
                  onClick={handleSendPaymentSMS}
                  className="w-full p-4 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex items-center justify-between text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-lg group-hover:bg-sky-500/30 transition">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Envoyer le lien par SMS</p>
                      <p className="text-xs text-slate-400">Envoyé directement au {quote.client.phone || 'client'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full">
                    Envoyer
                  </span>
                </button>

                {/* Copier le lien direct */}
                <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={paymentUrl}
                    className="bg-transparent text-xs text-slate-400 font-mono flex-1 outline-none truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                </div>
              </div>

              {/* Bouton de confirmation terrain */}
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl transition shadow-lg glow-amber flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {isProcessing ? 'Validation en cours...' : 'Valider le paiement sur place (CB / Espèces)'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
