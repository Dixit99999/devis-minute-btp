import React, { useRef, useState, useEffect } from 'react';
import type { Quote, ArtisanProfile } from '../types';
import { formatEuro, groupItemsByRoom } from '../utils/calculator';
import {
  FileText,
  CheckCircle2,
  Eraser,
  Lock,
  ArrowRight,
  CreditCard,
  Building2,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClientSignViewProps {
  quote: Quote;
  artisan: ArtisanProfile;
  onSignComplete: (signedQuote: Quote) => void;
  onBackToApp?: () => void;
}

export const ClientSignView: React.FC<ClientSignViewProps> = ({
  quote,
  artisan,
  onSignComplete,
  onBackToApp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isSigned, setIsSigned] = useState(Boolean(quote.signatureDataUrl));
  const [signedAt, setSignedAt] = useState<string>(quote.signedAt || '');
  const [signatureData, setSignatureData] = useState<string>(quote.signatureDataUrl || '');
  const [showPaymentOption, setShowPaymentOption] = useState(false);

  const groupedItems = groupItemsByRoom(quote.items);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [isSigned]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (e.cancelable && 'touches' in e) {
      e.preventDefault();
    }

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleValidateSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      alert('Veuillez apposer votre signature au doigt ou à la souris dans le cadre prévu.');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const nowStr = new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setSignatureData(dataUrl);
    setSignedAt(nowStr);
    setIsSigned(true);

    const updatedQuote: Quote = {
      ...quote,
      signatureDataUrl: dataUrl,
      signedAt: nowStr,
      status: 'signe',
    };

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    onSignComplete(updatedQuote);
    setShowPaymentOption(quote.depositAmountTTC > 0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-3 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Entreprise */}
        <header className="glass-panel p-5 sm:p-6 rounded-3xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg glow-amber">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white">{artisan.companyName}</h1>
              <p className="text-xs text-slate-400">
                {artisan.trade} • Tél : <span className="font-mono text-slate-300">{artisan.phone}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Validation en Ligne</span>
            <span className="text-xs font-mono text-slate-300">Devis N° {quote.number}</span>
          </div>
        </header>

        {/* Bannière de Statut */}
        {isSigned ? (
          <div className="bg-emerald-500/10 border-2 border-emerald-500/40 p-4 sm:p-5 rounded-3xl flex items-center gap-3 text-emerald-300 animate-in fade-in">
            <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm sm:text-base">Devis Validé & Signé avec Succès !</h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Signé électroniquement le {signedAt}. L'entreprise a été notifiée instantanément.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 text-amber-300">
            <Lock className="w-5 h-5 shrink-0" />
            <p className="text-xs">
              Veuillez vérifier les prestations ci-dessous et apposer votre signature en bas de page pour valider les travaux.
            </p>
          </div>
        )}

        {/* Corps du Devis Détaillé */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Client :</span>
              <h2 className="text-sm sm:text-base font-black text-white mt-0.5">{quote.client.name || 'Client'}</h2>
              <p className="text-xs text-slate-400">{quote.client.address} {quote.client.postalCode} {quote.client.city}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase">Date d'émission :</span>
              <p className="text-xs font-mono text-slate-200 mt-0.5">{quote.createdAt}</p>
              <p className="text-[11px] text-amber-400 mt-0.5">Valable jusqu'au {quote.validUntil}</p>
            </div>
          </div>

          {/* Prestations par Pièce */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Prestations & Fournitures Chiffrées
            </h3>

            {Object.entries(groupedItems).map(([room, group]) => (
              <div key={room} className="bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>📍 {room}</span>
                  <span className="font-mono text-amber-400">{formatEuro(group.totalTTC)} TTC</span>
                </div>
                <div className="divide-y divide-slate-900/60 p-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="py-2 px-2 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-white">{item.designation}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.quantity} {item.unit} • {formatEuro(item.unitPriceHT)} HT (TVA {item.vatRate}%)
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-200">{formatEuro(item.totalHT)} HT</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Récapitulatif Financier */}
          <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Total Hors Taxes (HT) :</span>
              <span className="font-mono text-slate-200">{formatEuro(quote.totalHT)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>TVA Totale :</span>
              <span className="font-mono text-slate-200">{formatEuro(quote.totalTVA)}</span>
            </div>
            <div className="flex justify-between text-base sm:text-lg font-black text-white pt-2 border-t border-slate-800">
              <span>TOTAL NET TTC :</span>
              <span className="font-mono text-amber-400">{formatEuro(quote.totalTTC)}</span>
            </div>

            {quote.depositPercent > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-amber-300 mt-2">
                <span>Acompte de démarrage ({quote.depositPercent}%) :</span>
                <span className="font-mono text-sm">{formatEuro(quote.depositAmountTTC)} TTC</span>
              </div>
            )}
          </div>

          {/* Zone de Signature Tactile */}
          {!isSigned ? (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Votre Signature (Bon pour Accord)
                  </h4>
                  <p className="text-[11px] text-slate-400">Signez au doigt ou à la souris dans le cadre ci-dessous</p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white flex items-center gap-1 hover:bg-slate-800 rounded-lg transition"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Effacer
                </button>
              </div>

              <div className="border-2 border-dashed border-amber-500/40 rounded-2xl bg-white overflow-hidden shadow-inner h-44">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full touch-none cursor-crosshair"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 mt-0.5"
                />
                <span>
                  Je confirme mon accord sur le devis n°{quote.number} d'un montant de{' '}
                  <strong>{formatEuro(quote.totalTTC)} TTC</strong> et autorise le démarrage des travaux.
                </span>
              </label>

              <button
                type="button"
                onClick={handleValidateSignature}
                disabled={!hasDrawn || !acceptedTerms}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl glow-emerald transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                <span>Valider et Signer le Devis</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-300">Signature enregistrée :</p>
                <p className="text-[11px] text-slate-400">Le {signedAt}</p>
              </div>
              {signatureData && (
                <div className="bg-white p-2 rounded-xl border border-slate-700">
                  <img src={signatureData} alt="Signature client" className="h-12 object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Option de Règlement d'Acompte en ligne immédiat */}
          {showPaymentOption && (
            <div className="bg-gradient-to-br from-amber-500/10 to-slate-900 p-5 rounded-3xl border border-amber-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <CreditCard className="w-5 h-5" />
                <span>Régler l'Acompte de Démarrage en Ligne</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vous pouvez régler votre acompte de <strong>{formatEuro(quote.depositAmountTTC)} TTC</strong> dès maintenant par Carte Bancaire ou Apple Pay pour bloquer l'intervention.
              </p>
              <button
                type="button"
                onClick={() => alert(`Redirection sécurisée vers le règlement d'acompte de ${formatEuro(quote.depositAmountTTC)} TTC...`)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg glow-amber transition flex items-center justify-center gap-2"
              >
                <span>Payer l'Acompte ({formatEuro(quote.depositAmountTTC)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mentions Légales & Garantie Décennale */}
          <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
            <p><strong>Garantie Décennale :</strong> {artisan.decennaleCompany} (Police N° {artisan.decennalePoliceNumber})</p>
            <p><strong>SIRET :</strong> {artisan.siret} • {artisan.companyName}, {artisan.address} {artisan.postalCode} {artisan.city}</p>
          </div>
        </div>

        {/* Bouton retour si utilisé en mode démonstration */}
        {onBackToApp && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBackToApp}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              ← Retour à l'application artisan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
