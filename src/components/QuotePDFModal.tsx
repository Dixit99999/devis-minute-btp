import React, { useRef, useState } from 'react';
import type { Quote, ArtisanProfile } from '../types';
import { formatEuro } from '../utils/calculator';
import {
  X,
  Download,
  MessageSquare,
  Send,
  CheckCircle2,
  Shield,
  FileText,
  CreditCard,
  User,
  MapPin,
  Receipt,
  Camera,
  Share2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ShareModal } from './ShareModal';

interface QuotePDFModalProps {
  quote: Quote;
  artisan: ArtisanProfile;
  onClose: () => void;
  onOpenPayment?: () => void;
  onConvertToInvoice?: (type: 'acompte' | 'solde') => void;
}

export const QuotePDFModal: React.FC<QuotePDFModalProps> = ({
  quote,
  artisan,
  onClose,
  onOpenPayment,
  onConvertToInvoice,
}) => {
  const printRef = useRef<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const docTitle =
    quote.docType === 'facture_acompte'
      ? `FACTURE D'ACOMPTE N° ${quote.invoiceNumber || quote.number}`
      : quote.docType === 'facture_solde'
      ? `FACTURE DE SOLDE N° ${quote.invoiceNumber || quote.number}`
      : `DEVIS N° ${quote.number}`;

  // Adresse du chantier résolue
  const siteAddressFull = quote.client.isSiteAddressDifferent && quote.client.siteAddress
    ? `${quote.client.siteAddress}, ${quote.client.siteCity || ''}`
    : quote.client.address
    ? `${quote.client.address}, ${quote.client.postalCode} ${quote.client.city}`
    : 'Même adresse que le client';

  const clientPhotos = (quote.photos || []).filter((p) => p.includeInPdf);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${(quote.docType || 'Devis').toUpperCase()}_${quote.number}_${(quote.client.name || 'Client').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erreur lors de la génération PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Bonjour ${quote.client.name || ''},\n\nVeuillez trouver votre ${docTitle.toLowerCase()} d'un montant de ${formatEuro(quote.totalTTC)} TTC.\n\nCordialement,\n${artisan.companyName} (${artisan.phone})`
    );
    const phone = quote.client.phone.replace(/[\s.-]/g, '');
    const cleanPhone = phone.startsWith('0') ? '33' + phone.substring(1) : phone;
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleShareSMS = () => {
    const text = encodeURIComponent(
      `Bonjour ${quote.client.name || ''}, voici votre ${docTitle.toLowerCase()} de ${formatEuro(quote.totalTTC)} TTC de l'entreprise ${artisan.companyName}. Merci de votre confiance.`
    );
    window.open(`sms:${quote.client.phone}?body=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-2 sm:my-6 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Header Modale Mobile-First */}
        <div className="p-3 sm:p-4 bg-slate-850 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">
                {docTitle}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Boutons d'Action Rapide */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsShareOpen(true)}
              className="py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow glow-amber"
            >
              <Share2 className="w-3.5 h-3.5" />
              Envoyer / Partager
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </button>

            <button
              onClick={handleShareSMS}
              className="py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
            >
              <Send className="w-3.5 h-3.5" />
              SMS
            </button>

            {onOpenPayment && (
              <button
                onClick={onOpenPayment}
                className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow glow-amber"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Acompte
              </button>
            )}

            {onConvertToInvoice && quote.status === 'signe' && (
              <button
                onClick={() => onConvertToInvoice('acompte')}
                className="py-2 px-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                Facture Acompte
              </button>
            )}

            {onConvertToInvoice && (quote.status === 'acompte_paye' || quote.status === 'facture_acompte') && (
              <button
                onClick={() => onConvertToInvoice('solde')}
                className="py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                Facture Solde
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              {isGenerating ? 'Export...' : 'PDF'}
            </button>
          </div>
        </div>

        {/* Zone de Contenu Scrollable */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-slate-950/70 custom-scrollbar space-y-4">
          
          {/* APERÇU MOBILE RESPONSIVE */}
          <div className="bg-white text-slate-900 p-4 sm:p-8 rounded-2xl shadow-xl space-y-5 text-xs">
            
            {/* En-tête Devis */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b-2 border-amber-500 pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Artisan Émetteur</span>
                <h2 className="text-base font-black text-slate-900 uppercase">{artisan.companyName}</h2>
                <p className="font-semibold text-slate-700 text-xs">{artisan.trade}</p>
                <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                  <p>{artisan.artisanName} • {artisan.phone}</p>
                  <p>{artisan.address}, {artisan.postalCode} {artisan.city}</p>
                  <p className="text-[10px]">SIRET : {artisan.siret} | TVA : {artisan.tvaIntra}</p>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3 rounded-xl sm:text-right space-y-1">
                <div className="text-amber-400 font-mono font-black text-sm uppercase">
                  {docTitle}
                </div>
                <p className="text-[10px] text-slate-300">Date : <strong>{quote.createdAt}</strong></p>
                <p className="text-[10px] text-slate-300">Validité : <strong>{quote.validUntil}</strong></p>
                <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {quote.status === 'signe' || quote.status === 'acompte_paye' ? 'Validé & Signé' : 'En cours'}
                </div>
              </div>
            </div>

            {/* Cadres Client & Lieu Chantier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" /> Client (Facturation)
                </span>
                <p className="font-bold text-slate-900 text-xs">{quote.client.name || 'Nom du client'}</p>
                <p className="text-slate-600 mt-0.5">{quote.client.address || 'Adresse'}</p>
                <p className="text-slate-600">{quote.client.postalCode} {quote.client.city}</p>
                <p className="text-slate-500 text-[11px] mt-1 font-mono">{quote.client.phone || '-'}</p>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-600" /> Lieu d'Exécution des Travaux
                </span>
                <p className="font-bold text-slate-900 text-xs">{siteAddressFull}</p>
                {quote.client.siteAccessNotes && (
                  <p className="text-amber-900 text-[10px] mt-1 bg-amber-100/60 p-1.5 rounded">
                    Accès : {quote.client.siteAccessNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Liste des Prestations Chiffrées */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Détail des Prestations ({quote.items.length})
              </span>

              <div className="space-y-2">
                {quote.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-xs">{item.designation}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Qté : <strong className="text-slate-700">{item.quantity} {item.unit}</strong> • PU : {formatEuro(item.unitPriceHT)} HT • TVA : <span className="text-amber-700 font-bold">{item.vatRate}%</span>
                      </p>
                    </div>

                    <div className="text-right sm:border-l sm:border-slate-200 sm:pl-3">
                      <span className="font-mono font-black text-slate-900 text-xs">
                        {formatEuro((item.quantity || 0) * (item.unitPriceHT || 0))} HT
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Annexe Photos de Chantier (si présentes) */}
            {clientPhotos.length > 0 && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                  Annexe Photographique du Chantier ({clientPhotos.length} photo(s))
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {clientPhotos.map((photo) => (
                    <div key={photo.id} className="bg-white p-1 rounded-lg border border-slate-200">
                      <img src={photo.dataUrl} alt="Chantier" className="h-20 w-full object-cover rounded" />
                      <p className="text-[9px] text-slate-500 mt-1 text-center font-medium capitalize">
                        {photo.type} • {photo.createdAt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Récapitulatif TVA & Totaux Financiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ventilation TVA */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Ventilation de la TVA
                </span>
                <div className="space-y-1 text-[11px]">
                  {Object.entries(quote.vatBreakdown || {}).map(([rate, vals]) => {
                    if (!vals || vals.baseHT === 0) return null;
                    return (
                      <div key={rate} className="flex justify-between border-b border-slate-100 pb-0.5">
                        <span className="text-slate-600">Taux {rate}% (Base: {formatEuro(vals.baseHT)})</span>
                        <span className="font-mono font-bold text-slate-800">{formatEuro(vals.vatAmount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totaux Généraux */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5">
                {quote.discountAmountHT > 0 && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Total Brut HT :</span>
                    <span className="font-mono">{formatEuro(quote.totalBrutHT || quote.totalHT)}</span>
                  </div>
                )}
                {quote.discountAmountHT > 0 && (
                  <div className="flex justify-between text-xs text-rose-400 font-semibold">
                    <span>Remise commerciale :</span>
                    <span className="font-mono">-{formatEuro(quote.discountAmountHT)} HT</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Total Net HT :</span>
                  <span className="font-mono font-bold">{formatEuro(quote.totalHT)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Total TVA :</span>
                  <span className="font-mono font-bold">{formatEuro(quote.totalTVA)}</span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline">
                  <span className="text-xs font-black uppercase text-amber-400">Total TTC :</span>
                  <span className="text-lg font-mono font-black text-amber-400">{formatEuro(quote.totalTTC)}</span>
                </div>
                {quote.docType === 'facture_solde' ? (
                  <div className="pt-1.5 border-t border-slate-800 text-[11px] text-emerald-300 flex justify-between">
                    <span>Acompte déjà réglé ({quote.depositPercent}%) :</span>
                    <span className="font-mono font-bold">-{formatEuro(quote.depositAmountTTC)}</span>
                  </div>
                ) : (
                  <div className="pt-1.5 border-t border-slate-800 text-[11px] text-amber-200 flex justify-between">
                    <span>Acompte à la commande ({quote.depositPercent}%) :</span>
                    <span className="font-mono font-bold">{formatEuro(quote.depositAmountTTC)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mentions Légales Assurance Décennale */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Garantie Décennale & RCP Obligatoire :
              </div>
              <p>
                Assureur : <strong>{artisan.decennaleCompany}</strong> • Police n° <strong>{artisan.decennalePoliceNumber}</strong> • Zone : {artisan.decennaleCoverageArea}.
              </p>
            </div>

            {/* Signature Accord Client */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Signature du Client (« Bon pour accord »)
              </span>
              {quote.signatureDataUrl ? (
                <div className="flex flex-col items-center py-2">
                  <img
                    src={quote.signatureDataUrl}
                    alt="Signature Client"
                    className="h-16 max-w-full object-contain"
                  />
                  <span className="text-[9px] text-emerald-700 font-bold mt-1">
                    Signé électroniquement le {quote.signedAt || quote.createdAt}
                  </span>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-400 italic text-[11px] border border-dashed border-slate-300 rounded-lg">
                  En attente de signature client
                </div>
              )}
            </div>
          </div>

          {/* VUE 2 : DOCUMENT A4 DÉDIÉ POUR L'EXPORTATION PDF JS-PDF */}
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <div
              ref={printRef}
              className="w-[800px] bg-white text-slate-900 p-12 text-xs font-sans"
              style={{ minHeight: '1120px' }}
            >
              {/* En-tête Document A4 */}
              <div className="flex justify-between items-start border-b-2 border-amber-500 pb-6 mb-6">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    {artisan.companyName}
                  </h1>
                  <p className="text-amber-600 font-bold text-xs mt-0.5">{artisan.trade}</p>
                  <div className="mt-2 text-slate-600 text-[11px] leading-relaxed">
                    <p>{artisan.artisanName}</p>
                    <p>{artisan.address}, {artisan.postalCode} {artisan.city}</p>
                    <p>Tél : <strong>{artisan.phone}</strong> | Email : {artisan.email}</p>
                    <p className="text-[10px] text-slate-500 mt-1">SIRET : {artisan.siret} • {artisan.rcsOrRma}</p>
                    <p className="text-[10px] text-slate-500">TVA Intra : {artisan.tvaIntra}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded text-sm font-black tracking-wider uppercase">
                    {docTitle}
                  </div>
                  <div className="mt-3 text-slate-600 text-[11px]">
                    <p>Date d'émission : <strong>{quote.createdAt}</strong></p>
                    <p>Validité de l'offre : <strong>{quote.validUntil}</strong></p>
                  </div>
                </div>
              </div>

              {/* Cadres Client & Chantier */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Client / Facturation
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{quote.client.name || 'Client'}</p>
                  <p className="text-slate-600 mt-1">{quote.client.address || 'Adresse'}</p>
                  <p className="text-slate-600">{quote.client.postalCode} {quote.client.city}</p>
                  <p className="text-slate-600 mt-1 text-[11px]">Tél : {quote.client.phone || '-'}</p>
                </div>

                <div className="bg-amber-50/60 p-4 rounded border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                    Lieu d'exécution des travaux
                  </span>
                  <p className="font-semibold text-slate-800">{siteAddressFull}</p>
                  {quote.client.siteAccessNotes && (
                    <p className="text-[10px] text-amber-900 mt-1">
                      Accès : {quote.client.siteAccessNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Tableau Prestations A4 */}
              <div className="mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-3">Désignation</th>
                      <th className="py-2.5 px-2 text-center">Qté</th>
                      <th className="py-2.5 px-2 text-center">Unité</th>
                      <th className="py-2.5 px-2 text-right">PU HT</th>
                      <th className="py-2.5 px-2 text-center">TVA</th>
                      <th className="py-2.5 px-3 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {quote.items.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{item.designation}</td>
                        <td className="py-2.5 px-2 text-center">{item.quantity}</td>
                        <td className="py-2.5 px-2 text-center text-slate-500">{item.unit}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatEuro(item.unitPriceHT)}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-amber-700">{item.vatRate}%</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {formatEuro((item.quantity || 0) * (item.unitPriceHT || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Photos Annexe A4 */}
              {clientPhotos.length > 0 && (
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded">
                  <p className="font-bold text-[10px] uppercase mb-2">Annexe Photographique Chantier</p>
                  <div className="grid grid-cols-3 gap-3">
                    {clientPhotos.map((photo) => (
                      <div key={photo.id} className="text-center">
                        <img src={photo.dataUrl} alt="Photo" className="h-24 w-full object-cover rounded border" />
                        <span className="text-[9px] text-slate-500 mt-1 block capitalize">{photo.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totaux & TVA A4 */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Ventilation TVA
                  </span>
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-1 text-left">Taux</th>
                        <th className="py-1 text-right">Base HT</th>
                        <th className="py-1 text-right">Montant TVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(quote.vatBreakdown || {}).map(([rate, vals]) => {
                        if (!vals || vals.baseHT === 0) return null;
                        return (
                          <tr key={rate}>
                            <td className="py-1 font-bold">{rate}%</td>
                            <td className="py-1 text-right font-mono">{formatEuro(vals.baseHT)}</td>
                            <td className="py-1 text-right font-mono font-bold">{formatEuro(vals.vatAmount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded space-y-1.5 text-xs">
                  {quote.discountAmountHT > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Total Brut HT :</span>
                      <span className="font-mono">{formatEuro(quote.totalBrutHT || quote.totalHT)}</span>
                    </div>
                  )}
                  {quote.discountAmountHT > 0 && (
                    <div className="flex justify-between text-rose-400 font-semibold">
                      <span>Remise commerciale :</span>
                      <span className="font-mono">-{formatEuro(quote.discountAmountHT)} HT</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>Total Général HT :</span>
                    <span className="font-mono font-bold">{formatEuro(quote.totalHT)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total TVA :</span>
                    <span className="font-mono font-bold">{formatEuro(quote.totalTVA)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline">
                    <span className="text-sm font-black uppercase text-amber-400">Total TTC :</span>
                    <span className="text-lg font-mono font-black text-amber-400">{formatEuro(quote.totalTTC)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-amber-200 flex justify-between">
                    <span>Acompte à la commande ({quote.depositPercent}%) :</span>
                    <span className="font-mono font-bold">{formatEuro(quote.depositAmountTTC)}</span>
                  </div>
                </div>
              </div>

              {/* Décennale A4 */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[9px] text-slate-500 mb-6">
                <p>
                  <strong>Assurance Décennale & RCP :</strong> {artisan.decennaleCompany} • Police n° {artisan.decennalePoliceNumber} • Couverture : {artisan.decennaleCoverageArea}.
                </p>
              </div>

              {/* Signatures A4 */}
              <div className="grid grid-cols-2 gap-6 border-t-2 border-slate-300 pt-4">
                <div>
                  <p className="font-bold text-[10px] uppercase">{artisan.companyName}</p>
                  <p className="text-[10px] text-slate-400 mt-6 italic">Document émis par voie informatique</p>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <p className="font-bold text-[10px] uppercase">Pour le client : Bon pour accord</p>
                  {quote.signatureDataUrl ? (
                    <div className="mt-2 flex flex-col items-center">
                      <img src={quote.signatureDataUrl} alt="Signature" className="h-14 object-contain" />
                      <span className="text-[8px] text-emerald-700 font-bold">
                        Signé électroniquement le {quote.signedAt || quote.createdAt}
                      </span>
                    </div>
                  ) : (
                    <div className="h-14 flex items-center justify-center text-slate-400 text-[10px]">
                      En attente de signature
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modale d'Envoi 1-Clic WhatsApp / SMS / Email */}
      <ShareModal
        quote={quote}
        artisan={artisan}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};
