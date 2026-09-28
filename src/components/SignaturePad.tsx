import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, X, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onClose: () => void;
  clientName: string;
  totalTTC: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onClose,
  clientName,
  totalTTC,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Règle la résolution interne du canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

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

    // Empêcher le scroll sur mobile pendant la signature
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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleValidate = () => {
    if (!canvasRef.current || !hasDrawn) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');

    // Confetti célébration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Signature tactile du client
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Faites signer votre client directement au doigt sur l'écran
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Devis & Accord */}
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200 flex justify-between items-center">
          <span>Client : <strong>{clientName || 'Particulier'}</strong></span>
          <span className="font-mono font-bold text-amber-400 text-sm">
            Total : {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalTTC)}
          </span>
        </div>

        {/* Canvas Zone */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
            <span className="font-semibold text-slate-300">
              Mention « Bon pour accord et exécution des travaux »
            </span>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs flex items-center gap-1 text-slate-400 hover:text-amber-400 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Effacer
            </button>
          </div>

          <div className="relative w-full h-48 bg-white rounded-xl shadow-inner border-2 border-dashed border-slate-300 overflow-hidden touch-none cursor-crosshair">
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                <span className="text-sm font-medium">Signez ici avec votre doigt</span>
                <span className="text-[11px] text-slate-400 mt-1">Écran tactile ou souris</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 text-center">
            Cette signature électronique vaut acceptation du devis et de ses conditions générales.
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-800/60 border-t border-slate-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-600 text-slate-300 font-medium text-sm hover:bg-slate-700 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleValidate}
            disabled={!hasDrawn}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
              hasDrawn
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 glow-amber'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Valider la signature
          </button>
        </div>
      </div>
    </div>
  );
};
