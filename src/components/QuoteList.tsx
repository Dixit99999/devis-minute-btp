import React, { useState } from 'react';
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
  Search,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Eye,
  Receipt,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'brouillon' | 'signe' | 'acompte_paye' | 'facture'>('all');
  const [reminderNotification, setReminderNotification] = useState<string | null>(null);

  // Statistiques de trésorerie consolidées
  const totalSignedAmount = quotes
    .filter((q) => q.status === 'signe' || q.status === 'acompte_paye' || q.status === 'facture_acompte' || q.status === 'facture_solde')
    .reduce((acc, q) => acc + q.totalTTC, 0);

  const depositsCollected = quotes
    .filter((q) => q.status === 'acompte_paye' || q.status === 'facture_acompte' || q.status === 'facture_solde')
    .reduce((acc, q) => acc + q.depositAmountTTC, 0);

  const pendingAmount = quotes
    .filter((q) => q.status === 'brouillon' || q.status === 'envoye')
    .reduce((acc, q) => acc + q.totalTTC, 0);

  const pendingQuotesCount = quotes.filter((q) => q.status === 'brouillon' || q.status === 'envoye').length;
  const signedQuotesCount = quotes.filter((q) => q.status === 'signe' || q.status === 'acompte_paye' || q.status === 'facture_acompte' || q.status === 'facture_solde').length;
  const conversionRate = quotes.length > 0 ? Math.round((signedQuotesCount / quotes.length) * 100) : 0;

  // Filtrage des devis
  const filteredQuotes = quotes.filter((q) => {
    // Filtre statut
    if (statusFilter === 'brouillon' && q.status !== 'brouillon' && q.status !== 'envoye') return false;
    if (statusFilter === 'signe' && q.status !== 'signe') return false;
    if (statusFilter === 'acompte_paye' && q.status !== 'acompte_paye') return false;
    if (statusFilter === 'facture' && q.status !== 'facture_acompte' && q.status !== 'facture_solde') return false;

    // Filtre recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchNumber = q.number.toLowerCase().includes(term);
      const matchClient = (q.client.name || '').toLowerCase().includes(term);
      const matchCity = (q.client.city || '').toLowerCase().includes(term);
      const matchPhone = (q.client.phone || '').includes(term);
      return matchNumber || matchClient || matchCity || matchPhone;
    }

    return true;
  });

  // 1. Relance SMS
  const handleSendReminderSMS = (quote: Quote, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSigned = quote.status === 'signe';
    const text = isSigned
      ? encodeURIComponent(
          `Bonjour ${quote.client.name || ''},\nVotre devis n°${quote.number} est bien validé. Pour bloquer la date d'intervention de ${artisan.companyName}, vous pouvez régler l'acompte de ${formatEuro(quote.depositAmountTTC)} ici : https://pay.devisminute-btp.fr/pay/${quote.id}\nMerci !`
        )
      : encodeURIComponent(
          `Bonjour ${quote.client.name || ''},\nJe reviens vers vous concernant le devis n°${quote.number} (${formatEuro(quote.totalTTC)} TTC) pour vos travaux. Avez-vous pu en prendre connaissance ? Je reste à votre entière disposition.\n${artisan.companyName} (${artisan.phone})`
        );

    window.open(`sms:${quote.client.phone}?body=${text}`, '_blank');
    setReminderNotification(`Relance SMS envoyée à ${quote.client.name || 'Client'}`);
    setTimeout(() => setReminderNotification(null), 3500);
  };

  // 2. Relance WhatsApp
  const handleSendReminderWhatsApp = (quote: Quote, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSigned = quote.status === 'signe';
    const text = isSigned
      ? encodeURIComponent(
          `Bonjour ${quote.client.name || ''},\n\nVotre devis n°${quote.number} est bien signé. Afin de planifier le démarrage du chantier, vous pouvez régler l'acompte de ${formatEuro(quote.depositAmountTTC)} par CB sécurisée :\nhttps://pay.devisminute-btp.fr/pay/${quote.id}\n\nCordialement,\n${artisan.companyName} (${artisan.phone})`
        )
      : encodeURIComponent(
          `Bonjour ${quote.client.name || ''},\n\nJe me permets de vous relancer concernant le devis n°${quote.number} d'un montant de ${formatEuro(quote.totalTTC)} TTC pour vos travaux.\n\nAvez-vous des questions particulières ? Je reste joignable au ${artisan.phone}.\n\nBien cordialement,\n${artisan.companyName}`
        );

    const phone = quote.client.phone.replace(/[\s.-]/g, '');
    const cleanPhone = phone.startsWith('0') ? '33' + phone.substring(1) : phone;
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    setReminderNotification(`Relance WhatsApp envoyée à ${quote.client.name || 'Client'}`);
    setTimeout(() => setReminderNotification(null), 3500);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. KPIs & Tableaux de Trésorerie */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* CA Signé */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">CA Signé</span>
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-amber-400">
            {formatEuro(totalSignedAmount)}
          </div>
          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {signedQuotesCount} devis validé(s)
          </p>
        </div>

        {/* Acomptes Encaissés */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Acomptes Encaissés</span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-emerald-400">
            {formatEuro(depositsCollected)}
          </div>
          <p className="text-[10px] text-slate-400">
            Trésorerie immédiate
          </p>
        </div>

        {/* En Attente de Signature */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">En Attente</span>
            <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-sky-400">
            {formatEuro(pendingAmount)}
          </div>
          <p className="text-[10px] text-sky-400 font-semibold">
            {pendingQuotesCount} devis à relancer
          </p>
        </div>

        {/* Taux de Signature */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Taux de Signature</span>
            <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-purple-400">
            {conversionRate} %
          </div>
          <p className="text-[10px] text-slate-400">
            Sur {quotes.length} devis émis
          </p>
        </div>
      </div>

      {/* Notification toast */}
      {reminderNotification && (
        <div className="px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reminderNotification}</span>
        </div>
      )}

      {/* 2. Barre d'outils : Recherche, Filtres & Création */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Champ de recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par client, ville, téléphone, n° de devis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 outline-none transition"
            />
          </div>

          <button
            onClick={onCreateNewQuote}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg glow-amber transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Devis Express</span>
          </button>
        </div>

        {/* Onglets de filtrage rapide */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tous ({quotes.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('brouillon')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0 ${
              statusFilter === 'brouillon'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            En attente ({quotes.filter((q) => q.status === 'brouillon' || q.status === 'envoye').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('signe')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0 ${
              statusFilter === 'signe'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            Signés ({quotes.filter((q) => q.status === 'signe').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('acompte_paye')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0 ${
              statusFilter === 'acompte_paye'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            Acomptes Payés ({quotes.filter((q) => q.status === 'acompte_paye').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('facture')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0 ${
              statusFilter === 'facture'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-indigo-400" />
            Facturés ({quotes.filter((q) => q.status === 'facture_acompte' || q.status === 'facture_solde').length})
          </button>
        </div>
      </div>

      {/* 3. Liste des Devis / Chantiers avec Relances 1-Clic */}
      {filteredQuotes.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-2xl border-dashed border-2 border-slate-800">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Aucun devis trouvé</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm ? "Aucun devis ne correspond à votre recherche." : "Créez votre premier devis conforme en moins de 2 minutes sur le chantier !"}
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
          {filteredQuotes.map((quote) => {
            const isPending = quote.status === 'brouillon' || quote.status === 'envoye';
            const isSigned = quote.status === 'signe';
            const isDepositPaid = quote.status === 'acompte_paye';
            const isInvoice = quote.status === 'facture_acompte' || quote.status === 'facture_solde';

            return (
              <div
                key={quote.id}
                onClick={() => onSelectQuote(quote)}
                className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Info Client & Devis */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    isDepositPaid
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : isSigned
                      ? 'bg-amber-500/10 text-amber-400'
                      : isInvoice
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-white text-sm">
                        {quote.invoiceNumber || quote.number}
                      </span>

                      {/* Badge Statut */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDepositPaid
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isSigned
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : isInvoice
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}>
                        {isDepositPaid
                          ? 'Acompte Encaissé'
                          : isSigned
                          ? 'Signé (Acompte en attente)'
                          : isInvoice
                          ? (quote.docType === 'facture_solde' ? 'Facture Solde' : 'Facture Acompte')
                          : 'En attente signature'}
                      </span>

                      {/* Badge Suggestion Relance */}
                      {isPending && (
                        <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" /> À relancer
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 font-semibold mt-1 truncate">
                      {quote.client.name || 'Client particulier'} 
                      {quote.client.phone && <span className="text-slate-400 font-mono text-[11px]"> • {quote.client.phone}</span>}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Émis le {quote.createdAt}</span>
                      <span>•</span>
                      <span>{quote.items.length} prestation(s)</span>
                      {quote.client.city && <span>• {quote.client.city}</span>}
                    </p>
                  </div>
                </div>

                {/* Montants & Relances Rapides */}
                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Total TTC</span>
                    <span className="font-mono font-black text-sm sm:text-base text-amber-400">
                      {formatEuro(quote.totalTTC)}
                    </span>
                    {quote.depositAmountTTC > 0 && (
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Acompte : {formatEuro(quote.depositAmountTTC)}
                      </span>
                    )}
                  </div>

                  {/* Actions 1-Clic */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Boutons de relance si devis en attente ou signé */}
                    {(isPending || isSigned) && quote.client.phone && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleSendReminderWhatsApp(quote, e)}
                          title="Relancer par WhatsApp en 1 clic"
                          className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Relance WA</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSendReminderSMS(quote, e)}
                          title="Relancer par SMS en 1 clic"
                          className="p-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">SMS</span>
                        </button>
                      </>
                    )}

                    {/* Aperçu PDF */}
                    <button
                      type="button"
                      onClick={() => onOpenPDF(quote)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                      title="Voir et télécharger le PDF"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>

                    {/* Encaissement Acompte direct */}
                    {quote.depositAmountTTC > 0 && !isDepositPaid && (
                      <button
                        type="button"
                        onClick={() => onOpenPayment(quote)}
                        className="px-2.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow glow-amber transition"
                        title="Encaisser l'acompte par QR Code / CB"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Acompte</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

