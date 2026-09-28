import React, { useState, useMemo } from 'react';
import type { Quote, ArtisanProfile } from '../types';
import {
  filterQuotesForExport,
  calculateVatAndRevenueSummary,
  generateSalesJournalCSV,
  generateFECFile,
  downloadFile,
} from '../utils/accountingExport';
import { formatEuro } from '../utils/calculator';
import {
  X,
  FileSpreadsheet,
  FileCode,
  Download,
  Mail,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Receipt,
  Sparkles,
  Info,
} from 'lucide-react';

interface AccountingExportModalProps {
  quotes: Quote[];
  artisan: ArtisanProfile;
  isOpen: boolean;
  onClose: () => void;
}

type PeriodFilter = 'month' | 'quarter' | 'year' | 'all';

export const AccountingExportModal: React.FC<AccountingExportModalProps> = ({
  quotes,
  artisan,
  isOpen,
  onClose,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [onlyPaidOrSigned, setOnlyPaidOrSigned] = useState<boolean>(true);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Calcul des dates en fonction de la période choisie
  const dateRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    if (period === 'month') {
      const start = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const end = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      return { start, end };
    }

    if (period === 'quarter') {
      const quarterIndex = Math.floor(currentMonth / 3);
      const start = new Date(currentYear, quarterIndex * 3, 1).toISOString().split('T')[0];
      const end = new Date(currentYear, (quarterIndex + 1) * 3, 0).toISOString().split('T')[0];
      return { start, end };
    }

    if (period === 'year') {
      const start = `${currentYear}-01-01`;
      const end = `${currentYear}-12-31`;
      return { start, end };
    }

    return { start: undefined, end: undefined };
  }, [period]);

  // Filtrage des données
  const filteredQuotes = useMemo(() => {
    return filterQuotesForExport(quotes, {
      startDate: dateRange.start,
      endDate: dateRange.end,
      onlyPaidOrSigned,
    });
  }, [quotes, dateRange, onlyPaidOrSigned]);

  // Synthèse financière & TVA
  const summary = useMemo(() => {
    return calculateVatAndRevenueSummary(filteredQuotes);
  }, [filteredQuotes]);

  if (!isOpen) return null;

  // Actions de téléchargement
  const handleDownloadCSV = () => {
    const csvContent = generateSalesJournalCSV(filteredQuotes, artisan);
    const dateTag = dateRange.start ? `${dateRange.start}_au_${dateRange.end || 'fin'}` : 'global';
    const filename = `Journal_Ventes_BTP_${artisan.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateTag}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  };

  const handleDownloadFEC = () => {
    const fecContent = generateFECFile(filteredQuotes, artisan);
    const siren = (artisan.siret || '000000000').replace(/\s/g, '').slice(0, 9);
    const yearStr = (dateRange.start ? dateRange.start.slice(0, 4) : new Date().getFullYear().toString());
    const filename = `${siren}FEC${yearStr}1231.txt`;
    downloadFile(fecContent, filename, 'text/plain;charset=utf-8;');
  };

  const handleEmailAccountant = () => {
    const subject = encodeURIComponent(`[Comptabilité BTP] Journal des ventes & récapitulatif TVA - ${artisan.companyName}`);
    const body = encodeURIComponent(`Bonjour,

Veuillez trouver ci-dessous la synthèse de notre activité pour la période :

🏢 Entreprise : ${artisan.companyName} (SIRET : ${artisan.siret || 'Non renseigné'})
📊 Période : ${dateRange.start ? `Du ${dateRange.start} au ${dateRange.end}` : 'Toutes périodes'}

📈 CHIFFRES CLÉS :
- Nombre de devis/factures signés : ${summary.countSigned}
- Chiffre d'Affaires Total HT : ${formatEuro(summary.totalHT)}
- Total TTC : ${formatEuro(summary.totalTTC)}
- Acomptes encaissés : ${formatEuro(summary.totalDepositsCollected)}

📋 DÉTAIL TVA COLLECTÉE (Déclaration) :
- TVA 20.0% : Base HT ${formatEuro(summary.byVatRate[20].baseHT)} | Montant TVA : ${formatEuro(summary.byVatRate[20].vatAmount)}
- TVA 10.0% : Base HT ${formatEuro(summary.byVatRate[10].baseHT)} | Montant TVA : ${formatEuro(summary.byVatRate[10].vatAmount)}
- TVA 5.5%  : Base HT ${formatEuro(summary.byVatRate[5.5].baseHT)} | Montant TVA : ${formatEuro(summary.byVatRate[5.5].vatAmount)}
- Total TVA collectée : ${formatEuro(summary.totalTVA)}

Les fichiers d'écritures (Journal CSV Excel et FEC DGFIP) sont téléchargeables directement depuis l'application Devis Minute BTP.

Bien cordialement,
${artisan.artisanName}
${artisan.phone}`);

    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopySummary = () => {
    const text = `Synthèse Comptable BTP - ${artisan.companyName}
CA Total HT : ${formatEuro(summary.totalHT)}
Total TTC : ${formatEuro(summary.totalTTC)}
TVA Collectée : ${formatEuro(summary.totalTVA)}
Acomptes encaissés : ${formatEuro(summary.totalDepositsCollected)}
Nombre de pièces : ${summary.countSigned}`;

    navigator.clipboard.writeText(text);
    setCopiedNotification('Synthèse copiée dans le presse-papier !');
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900/60 to-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Export Comptable & FEC
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  DGFIP & Excel
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Journal des ventes, écritures comptables et ventilation TVA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          
          {/* Sélection de la Période */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              1. Choisir la période comptable
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  period === 'month'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Mois en cours
              </button>
              <button
                type="button"
                onClick={() => setPeriod('quarter')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  period === 'quarter'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Ce trimestre
              </button>
              <button
                type="button"
                onClick={() => setPeriod('year')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  period === 'year'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Année complète
              </button>
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  period === 'all'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Tout l'historique
              </button>
            </div>

            {/* Option devis validés */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="onlyPaidOrSigned"
                checked={onlyPaidOrSigned}
                onChange={(e) => setOnlyPaidOrSigned(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
              />
              <label htmlFor="onlyPaidOrSigned" className="text-xs text-slate-300 cursor-pointer select-none">
                Exporter uniquement les devis <span className="font-semibold text-emerald-400">signés</span>, <span className="font-semibold text-blue-400">acomptes payés</span> et facturés (recommandé pour l'expert-comptable)
              </label>
            </div>
          </div>

          {/* Synthèse Chiffrée & TVA */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                2. Synthèse financière ({filteredQuotes.length} pièces sélectionnées)
              </span>
              <button
                onClick={handleCopySummary}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                Copier résumé
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/50">
                <p className="text-[11px] text-slate-400">CA Total HT</p>
                <p className="text-base font-bold text-white mt-0.5">{formatEuro(summary.totalHT)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/50">
                <p className="text-[11px] text-slate-400">Total TVA</p>
                <p className="text-base font-bold text-amber-400 mt-0.5">{formatEuro(summary.totalTVA)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/50">
                <p className="text-[11px] text-slate-400">Total TTC</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{formatEuro(summary.totalTTC)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/50">
                <p className="text-[11px] text-slate-400">Acomptes Reçus</p>
                <p className="text-base font-bold text-blue-400 mt-0.5">{formatEuro(summary.totalDepositsCollected)}</p>
              </div>
            </div>

            {/* Détail TVA */}
            <div className="pt-2 border-t border-slate-700/50">
              <p className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-slate-400" />
                Ventilation de la TVA collectée (Déclaration CA3 / CA12) :
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-900/40 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 font-medium">Taux 20.0% :</span>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {formatEuro(summary.byVatRate[20].vatAmount)}
                  </div>
                  <div className="text-[10px] text-slate-500">Base: {formatEuro(summary.byVatRate[20].baseHT)}</div>
                </div>
                <div className="bg-slate-900/40 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 font-medium">Taux 10.0% (Rénov.) :</span>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {formatEuro(summary.byVatRate[10].vatAmount)}
                  </div>
                  <div className="text-[10px] text-slate-500">Base: {formatEuro(summary.byVatRate[10].baseHT)}</div>
                </div>
                <div className="bg-slate-900/40 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 font-medium">Taux 5.5% (Énergie) :</span>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {formatEuro(summary.byVatRate[5.5].vatAmount)}
                  </div>
                  <div className="text-[10px] text-slate-500">Base: {formatEuro(summary.byVatRate[5.5].baseHT)}</div>
                </div>
              </div>
            </div>

            {copiedNotification && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded border border-emerald-800/40 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {copiedNotification}
              </div>
            )}
          </div>

          {/* Formats de téléchargement */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-blue-400" />
              3. Télécharger les fichiers comptables
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: CSV Excel */}
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/60 text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                    Journal Ventes CSV (Excel)
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tableur complet avec TVA ventilée, acomptes et détails clients.
                  </p>
                </div>
              </button>

              {/* Option 2: FEC DGFIP */}
              <button
                type="button"
                onClick={handleDownloadFEC}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-blue-500/60 text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                    Fichier FEC DGFIP (.txt)
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Conforme Article A.47 A-1 (Sage, Pennylane, Cegid, EBP).
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Bouton direct vers l'expert-comptable */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleEmailAccountant}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01]"
            >
              <Mail className="w-4 h-4" />
              Transmettre le récapitulatif par Email à mon comptable
            </button>
          </div>

          {/* Info légale */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              Le journal et le FEC générés respectent le Plan Comptable Général (PCG) français avec les comptes de classe 7 (706000), classe 4 (411000, 445711, 445712, 445713) et classe 5 (512000).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
