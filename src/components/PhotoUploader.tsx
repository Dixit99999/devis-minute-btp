import React, { useRef, useState } from 'react';
import type { QuotePhoto } from '../types';
import { Camera, Image as ImageIcon, Trash2, Eye, Plus, Check, FileCheck } from 'lucide-react';

interface PhotoUploaderProps {
  photos: QuotePhoto[];
  onChange: (photos: QuotePhoto[]) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ photos = [], onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoForPreview, setSelectedPhotoForPreview] = useState<QuotePhoto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fonction de compression d'image pour ne pas saturer le stockage ni le PDF
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDimension = 1200;

          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // Export JPEG compressé
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newPhotos: QuotePhoto[] = [...photos];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressedData = await compressImage(file);
        newPhotos.push({
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          dataUrl: compressedData,
          caption: file.name.replace(/\.[^/.]+$/, '').substring(0, 40) || 'Constat chantier',
          type: 'constat',
          includeInPdf: true,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Erreur compression image:', err);
      }
    }

    onChange(newPhotos);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
    if (selectedPhotoForPreview?.id === id) setSelectedPhotoForPreview(null);
  };

  const handleUpdatePhoto = (id: string, updates: Partial<QuotePhoto>) => {
    onChange(photos.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Photos de Chantier & Constats ({photos.length})
          </h4>
        </div>
        <span className="text-[10px] text-slate-400">
          Recommandé pour accélérer la signature
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Grille des photos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Bouton d'ajout */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="h-36 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 transition flex flex-col items-center justify-center gap-2 text-amber-400 group cursor-pointer"
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 group-hover:scale-110 transition flex items-center justify-center text-amber-300">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                Prendre photo
              </span>
              <span className="text-[10px] text-slate-500">ou importer</span>
            </>
          )}
        </button>

        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative h-36 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 flex flex-col shadow-md"
          >
            <img
              src={photo.dataUrl}
              alt={photo.caption}
              className="w-full h-24 object-cover cursor-pointer group-hover:scale-105 transition duration-300"
              onClick={() => setSelectedPhotoForPreview(photo)}
            />

            {/* Badge type */}
            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[9px] font-bold text-amber-300 border border-amber-500/30">
              {photo.type === 'avant' ? 'Avant' : photo.type === 'apres' ? 'Après' : 'Constat'}
            </span>

            {/* Actions overlay */}
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition">
              <button
                type="button"
                onClick={() => setSelectedPhotoForPreview(photo)}
                className="p-1 rounded-lg bg-slate-900/90 text-slate-200 hover:text-white"
                title="Agrandir"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemovePhoto(photo.id)}
                className="p-1 rounded-lg bg-rose-950/90 text-rose-400 hover:text-rose-200 border border-rose-500/30"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Légende & Option PDF */}
            <div className="p-1.5 bg-slate-950/90 flex items-center justify-between gap-1 flex-1">
              <input
                type="text"
                value={photo.caption}
                onChange={(e) => handleUpdatePhoto(photo.id, { caption: e.target.value })}
                placeholder="Légende..."
                className="bg-transparent text-[10px] text-slate-300 w-full outline-none font-medium truncate"
              />
              <button
                type="button"
                onClick={() => handleUpdatePhoto(photo.id, { includeInPdf: !photo.includeInPdf })}
                title={photo.includeInPdf ? 'Incluse dans le PDF' : 'Non incluse dans le PDF'}
                className={`p-1 rounded text-[10px] shrink-0 font-bold transition flex items-center gap-0.5 ${
                  photo.includeInPdf
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <FileCheck className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Prévisualisation Plein Écran */}
      {selectedPhotoForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-4 rounded-3xl border border-amber-500/30 space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                {selectedPhotoForPreview.caption || 'Photo Chantier'}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedPhotoForPreview(null)}
                className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1"
              >
                Fermer ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden max-h-[60vh] flex items-center justify-center bg-black/40">
              <img
                src={selectedPhotoForPreview.dataUrl}
                alt={selectedPhotoForPreview.caption}
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Type de constat</label>
                <select
                  value={selectedPhotoForPreview.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'avant' | 'apres' | 'constat';
                    handleUpdatePhoto(selectedPhotoForPreview.id, { type: newType });
                    setSelectedPhotoForPreview((prev) => (prev ? { ...prev, type: newType } : null));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                >
                  <option value="constat">Constat Général</option>
                  <option value="avant">Avant Travaux (État des lieux)</option>
                  <option value="apres">Après Travaux (Réception)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Affichage PDF</label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !selectedPhotoForPreview.includeInPdf;
                    handleUpdatePhoto(selectedPhotoForPreview.id, { includeInPdf: next });
                    setSelectedPhotoForPreview((prev) => (prev ? { ...prev, includeInPdf: next } : null));
                  }}
                  className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    selectedPhotoForPreview.includeInPdf
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {selectedPhotoForPreview.includeInPdf ? 'Annexe PDF active' : 'Masquée du PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
