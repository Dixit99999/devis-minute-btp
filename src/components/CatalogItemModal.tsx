import React, { useState, useEffect } from 'react';
import type { PresetCatalogItem, VatRate } from '../types';
import { X, Save, Trash2, Sparkles } from 'lucide-react';

interface CatalogItemModalProps {
  item: PresetCatalogItem | null; // null si création d'un nouvel élément
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: PresetCatalogItem) => void;
  onDelete?: (id: string) => void;
}

export const CatalogItemModal: React.FC<CatalogItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(item);

  const [formData, setFormData] = useState<PresetCatalogItem>({
    id: 'custom-' + Date.now(),
    trade: 'general',
    label: '',
    category: 'fourniture',
    defaultPriceHT: 150,
    defaultUnit: 'u',
    defaultVatRate: 10,
  });

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({
        id: 'custom-' + Date.now(),
        trade: 'general',
        label: '',
        category: 'fourniture',
        defaultPriceHT: 150,
        defaultUnit: 'u',
        defaultVatRate: 10,
      });
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {isEditing ? 'Modifier la prestation catalogue' : 'Ajouter une prestation au catalogue'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Personnalisez vos ouvrages favoris</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Désignation de la prestation / fourniture
            </label>
            <input
              type="text"
              placeholder="Ex: Remplacement chauffe-eau 250L vertical blindé"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none shadow-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Corps de Métier
              </label>
              <select
                value={formData.trade}
                onChange={(e) => setFormData({ ...formData, trade: e.target.value as any })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none shadow-sm"
              >
                <option value="plomberie">Plomberie & Chauffage</option>
                <option value="electricite">Électricité</option>
                <option value="serrurerie">Serrurerie</option>
                <option value="peinture">Peinture & Rénov</option>
                <option value="climatisation">Climatisation & PAC</option>
                <option value="general">Général / BTP</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Catégorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none shadow-sm"
              >
                <option value="fourniture">Fourniture / Matériel</option>
                <option value="main_d_oeuvre">Main-d'œuvre</option>
                <option value="forfait">Forfait complet</option>
                <option value="deplacement">Déplacement</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Prix HT par défaut (€)
              </label>
              <input
                type="number"
                step="any"
                value={formData.defaultPriceHT}
                onChange={(e) => setFormData({ ...formData, defaultPriceHT: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white font-mono text-center font-bold focus:border-amber-500 outline-none shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Unité
              </label>
              <select
                value={formData.defaultUnit}
                onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value as any })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none shadow-sm"
              >
                <option value="u">Unité (u)</option>
                <option value="forfait">Forfait</option>
                <option value="h">Heure (h)</option>
                <option value="m²">m²</option>
                <option value="ml">Mètre lin. (ml)</option>
                <option value="j">Jour (j)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Taux TVA
              </label>
              <select
                value={formData.defaultVatRate}
                onChange={(e) => setFormData({ ...formData, defaultVatRate: parseFloat(e.target.value) as VatRate })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-amber-600 dark:text-amber-400 font-bold focus:border-amber-500 outline-none shadow-sm"
              >
                <option value={10}>10% (Rénov)</option>
                <option value={20}>20% (Neuf)</option>
                <option value={5.5}>5.5% (Éco)</option>
                <option value={0}>0% (Exo)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(formData.id);
                  onClose();
                }}
                className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                title="Supprimer du catalogue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg glow-amber transition flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
