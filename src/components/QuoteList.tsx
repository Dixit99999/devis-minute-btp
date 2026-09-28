import React from 'react';
import type { Quote, ArtisanProfile } from '../types';
import { formatEuro } from '../utils/calculator';
import {
  FileText,
  CheckCircle2,
  Clock,
  CreditCard,
  Send,
  Plus,
  TrendingUp,
} from 'lucide-react';

interface QuoteListProps {
  quotes: Quote[];
  artisan: ArtisanProfile;
  onSelectQuote: (quote: Quote) => void;
  onCreateNewQuote: () => void;
  onOpenPDF: (quote: Quote) => void;
  onOpenPayment: (quote: Quote) => void;
}

export const QuoteList: React.FC<QuoteListProps> = ({
  quotes,
  artisan,
  onSelectQuote,
  onCreateNewQuote,
  onOpenPDF,
  onOpenPayment,
}) => {
  // Statistiques du mois
  const totalSignedAmount = quotes
    .filter((q) => q.status === 'signe' || q.status === 'acompte_paye')
    .reduce((acc, q) => acc + q.totalTTC, 0);

  const depositsCollected = quotes
    .filter((q) => q.status === 'acompte_paye')
    .reduce((acc, q) => acc + q.depositAmountTTC, 0);

  const pendingQuotesCount = quotes.filter((q) => q.status === 'brouillon' || q.status === 'envoye').length;

  const handleSendReminderSMS = (quote: Quote, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = encodeURIComponent(
      `Bonjour ${quote.client.name}, je me permets de revenir vers vous concernant le devis ${quote.number} (${formatEuro(quote.totalTTC)} TTC) pour vos travaux. Avez-vous pu en prendre connaissance ? Je reste à votre disposition. ${artisan.companyName} (${artisan.phone})`
    );
    window.open(`sms:${quote.client.phone}?body=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* KPIs & Statistiques Chiffre d'Affaires */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Devis Signés (Mois)</span>
            <div className="text-xl font-mono font-black text-amber-400 mt-1">
              {formatEuro(totalSignedAmount)}
            </div>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +35% vs mois dernier
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Acomptes Encaissés</span>
            <div className="text-xl font-mono font-black text-emerald-400 mt-1">
              {formatEuro(depositsCollected)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Trésorerie garantie</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Devis en attente</span>
            <div className="text-xl font-mono font-black text-sky-400 mt-1">
              {pendingQuotesCount} devis
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">À relancer par SMS</p>
          </div>
          <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Header Liste */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Historique de vos Chantiers & Devis</h2>
          <p className="text-xs text-slate-400">Accédez rapidement à vos devis, relancez et faites signer</p>
        </div>
        <button
          onClick={onCreateNewQuote}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg glow-amber transition"
        >
          <Plus className="w-4 h-4" />
          Nouveau Devis
        </button>
      </div>

      {/* Tableau / Cartes des Devis */}
      {quotes.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-2xl">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Aucun devis créé pour l'instant</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Créez votre premier devis conforme en moins de 2 minutes sur le chantier !
          </p>
          <button
            onClick={onCreateNewQuote}
            className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow glow-amber"
          >
            Créer un devis maintenant
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              onClick={() => onSelectQuote(quote)}
              className="glass-card p-4 rounded-xl border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-amber-500/10 transition">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{quote.number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      quote.status === 'acompte_paye'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : quote.status === 'signe'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {quote.status === 'acompte_paye'
                        ? 'Acompte Réglé'
                        : quote.status === 'signe'
                        ? 'Signé'
                        : 'En attente'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold mt-0.5">
                    {quote.client.name || 'Client sans nom'} {quote.client.city && `• ${quote.client.city}`}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Émis le {quote.createdAt} • {quote.items.length} prestation(s)
                  </p>
                </div>
              </div>

              {/* Montants et Actions rapides */}
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 block">Total TTC</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-amber-400">
                    {formatEuro(quote.totalTTC)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Acompte: {formatEuro(quote.depositAmountTTC)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {quote.status === 'brouillon' && quote.client.phone && (
                    <button
                      onClick={(e) => handleSendReminderSMS(quote, e)}
                      title="Relancer le client par SMS"
                      className="p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Relancer SMS</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenPDF(quote)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                    title="Voir le PDF"
                  >
                    PDF
                  </button>

                  <button
                    onClick={() => onOpenPayment(quote)}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold transition"
                    title="Encaissement"
                  >
                    Acompte
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
