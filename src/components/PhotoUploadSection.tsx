import React, { useRef } from 'react';
import type { QuotePhoto } from '../types';
import { Camera, Trash2, Eye, EyeOff, Plus, Image as ImageIcon } from 'lucide-react';

interface PhotoUploadSectionProps {
  photos: QuotePhoto[];
  onChange: (photos: QuotePhoto[]) => void;
}

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  photos = [],
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const newPhoto: QuotePhoto = {
          id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          dataUrl,
          caption: 'Constat chantier - ' + new Date().toLocaleDateString('fr-FR'),
          type: 'constat',
          includeInPdf: true,
          createdAt: new Date().toLocaleDateString('fr-FR'),
        };

        onChange([...photos, newPhoto]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleIncludeInPdf = (id: string) => {
    onChange(
      photos.map((p) => (p.id === id ? { ...p, includeInPdf: !p.includeInPdf } : p))
    );
  };

  const handleTypeChange = (id: string, type: 'avant' | 'apres' | 'constat') => {
    onChange(
      photos.map((p) => (p.id === id ? { ...p, type } : p))
    );
  };

  const handleRemovePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="glass-card p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Photos de Chantier & Constat ({photos.length})
          </h3>
        </div>

        {/* Bouton Prendre Photo / Ajouter */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
        >
          <Camera className="w-3.5 h-3.5" />
          Prendre une photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {photos.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-4 border-2 border-dashed border-slate-800 hover:border-amber-500/40 rounded-xl text-center cursor-pointer transition"
        >
          <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-300">
            Ajoutez 1 à 3 photos du chantier
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Tuyauterie, tableau électrique, dégât des eaux, etc.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden flex flex-col group relative"
            >
              {/* Image Preview */}
              <div className="relative h-28 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={photo.dataUrl}
                  alt={photo.caption}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Actions & Toggles */}
              <div className="p-2 space-y-1.5 text-[10px]">
                {/* Type Tag */}
                <select
                  value={photo.type}
                  onChange={(e) => handleTypeChange(photo.id, e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-slate-300 text-[10px] font-semibold outline-none"
                >
                  <option value="constat">Constat Initial</option>
                  <option value="avant">Avant Travaux</option>
                  <option value="apres">Après Travaux</option>
                </select>

                {/* Toggle PDF Client */}
                <button
                  type="button"
                  onClick={() => handleToggleIncludeInPdf(photo.id)}
                  className={`w-full py-1 px-1.5 rounded flex items-center justify-center gap-1 font-semibold transition ${
                    photo.includeInPdf
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {photo.includeInPdf ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {photo.includeInPdf ? 'Sur devis client' : 'Usage interne seul'}
                </button>
              </div>
            </div>
          ))}

          {/* Bouton ajouter une photo supplémentaire */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-full min-h-[140px] border-2 border-dashed border-slate-800 hover:border-amber-500/40 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-amber-400 cursor-pointer transition"
          >
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Ajouter</span>
          </div>
        </div>
      )}
    </div>
  );
};
