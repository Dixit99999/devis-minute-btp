import React, { useState } from 'react';
import type {
  Quote,
  QuoteItem,
  VatRate,
  ClientInfo,
  ArtisanProfile,
  PresetCatalogItem,
  QuotePhoto,
} from '../types';
import { PRESET_CATALOG } from '../data/presets';
import { calculateTotals, formatEuro } from '../utils/calculator';
import { parseVoiceInputAdvanced } from '../utils/voiceParser';
import { MicrophonePermissionModal } from './MicrophonePermissionModal';
import { PhotoUploadSection } from './PhotoUploadSection';
import { CatalogItemModal } from './CatalogItemModal';
import { ShareModal } from './ShareModal';
import {
  Mic,
  MicOff,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  PenTool,
  FileText,
  User,
  Phone,
  MapPin,
  Wrench,
  Flame,
  Zap,
  Lock,
  Paintbrush,
  Snowflake,
  Layers,
  Building,
  CheckSquare,
  Square,
  Percent,
  Euro,
  TrendingUp,
  Clock,
  Car,
  Pencil,
  RotateCcw,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickQuoteEditorProps {
  quote: Quote;
  artisan: ArtisanProfile;
  onUpdateQuote: (updatedQuote: Quote) => void;
  onOpenSignature: () => void;
  onOpenPreview: () => void;
}

export const QuickQuoteEditor: React.FC<QuickQuoteEditorProps> = ({
  quote,
  artisan,
  onUpdateQuote,
  onOpenSignature,
  onOpenPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'catalog'>('editor');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);
  const [showMargin, setShowMargin] = useState(false);

  // Catalogue personnalisable avec persistance locale
  const STORAGE_KEY_CATALOG = 'devis_minute_custom_catalog';
  const [catalog, setCatalog] = useState<PresetCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATALOG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return PRESET_CATALOG;
  });

  const [editingCatalogItem, setEditingCatalogItem] = useState<PresetCatalogItem | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const saveCatalog = (newCatalog: PresetCatalogItem[]) => {
    setCatalog(newCatalog);
    try {
      localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(newCatalog));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNewCatalogItem = () => {
    setEditingCatalogItem(null);
    setIsCatalogModalOpen(true);
  };

  const handleOpenEditCatalogItem = (item: PresetCatalogItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCatalogItem(item);
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalogItem = (item: PresetCatalogItem) => {
    const exists = catalog.some((c) => c.id === item.id);
    let updated: PresetCatalogItem[];
    if (exists) {
      updated = catalog.map((c) => (c.id === item.id ? item : c));
    } else {
      updated = [item, ...catalog];
    }
    saveCatalog(updated);
  };

  const handleDeleteCatalogItem = (id: string) => {
    const updated = catalog.filter((c) => c.id !== id);
    saveCatalog(updated);
  };

  const handleResetCatalog = () => {
    if (window.confirm("Réinitialiser le catalogue aux prestations d'origine ?")) {
      saveCatalog(PRESET_CATALOG);
    }
  };

  // Recalculer les totaux dès que items, depositPercent ou discount changent
  const updateCalculation = (
    newItems: QuoteItem[],
    newDepositPercent: number = quote.depositPercent,
    newDiscountType: 'percent' | 'fixed' = quote.discountType || 'percent',
    newDiscountValue: number = quote.discountValue || 0,
    newPhotos: QuotePhoto[] = quote.photos || []
  ) => {
    const totals = calculateTotals(newItems, newDepositPercent, newDiscountType, newDiscountValue);
    onUpdateQuote({
      ...quote,
      items: newItems,
      depositPercent: newDepositPercent,
      discountType: newDiscountType,
      discountValue: newDiscountValue,
      photos: newPhotos,
      ...totals,
    });
  };

  const handleClientChange = (field: keyof ClientInfo, value: any) => {
    onUpdateQuote({
      ...quote,
      client: {
        ...quote.client,
        [field]: value,
      },
    });
  };

  const handleAddItem = (preset?: PresetCatalogItem) => {
    const newItem: QuoteItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      designation: preset ? preset.label : 'Nouvelle prestation / fourniture',
      category: preset ? preset.category : 'main_d_oeuvre',
      quantity: 1,
      unit: preset ? preset.defaultUnit : 'forfait',
      unitPriceHT: preset ? preset.defaultPriceHT : artisan.defaultHourlyRate || 60,
      costPriceHT: preset?.costEstimateHT || (preset?.defaultPriceHT ? preset.defaultPriceHT * 0.4 : 0),
      vatRate: preset ? preset.defaultVatRate : 10,
      totalHT: preset ? preset.defaultPriceHT : artisan.defaultHourlyRate || 60,
    };

    updateCalculation([...quote.items, newItem]);
    if (preset) {
      setActiveTab('editor');
    }
  };

  // Raccourcis forfaits rapides
  const handleAddQuickHour = (hours: number) => {
    const rate = artisan.defaultHourlyRate || 60;
    const newItem: QuoteItem = {
      id: 'item-h-' + Date.now(),
      designation: `Main-d'œuvre qualifiée (${hours}h)`,
      category: 'main_d_oeuvre',
      quantity: hours,
      unit: 'h',
      unitPriceHT: rate,
      costPriceHT: rate * 0.3,
      vatRate: 10,
      totalHT: hours * rate,
    };
    updateCalculation([...quote.items, newItem]);
  };

  const handleAddQuickTravel = () => {
    const newItem: QuoteItem = {
      id: 'item-travel-' + Date.now(),
      designation: 'Forfait déplacement & prise en charge chantier',
      category: 'deplacement',
      quantity: 1,
      unit: 'forfait',
      unitPriceHT: 50,
      costPriceHT: 15,
      vatRate: 10,
      totalHT: 50,
    };
    updateCalculation([...quote.items, newItem]);
  };

  const handleIncrementQty = (id: string, delta: number) => {
    const newItems = quote.items.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(0.5, (item.quantity || 1) + delta);
        return {
          ...item,
          quantity: newQty,
          totalHT: newQty * (item.unitPriceHT || 0),
        };
      }
      return item;
    });
    updateCalculation(newItems);
  };

  const handleRemoveItem = (id: string) => {
    updateCalculation(quote.items.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof QuoteItem, value: any) => {
    const newItems = quote.items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPriceHT') {
          updated.totalHT = (updated.quantity || 0) * (updated.unitPriceHT || 0);
        }
        return updated;
      }
      return item;
    });
    updateCalculation(newItems);
  };

  // Reconnaissance vocale Web Speech API avec analyse sémantique avancée
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setShowMicPermissionModal(true);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceHint("🎤 Parlez : ex 'Pose de 2 unités de chauffage 450€' ou 'Remise de 5%'");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const parsedIntent = parseVoiceInputAdvanced(transcript);

        if (!parsedIntent) {
          setVoiceHint("⚠️ Phrase non reconnue. Réessayez clairement.");
          return;
        }

        // 1. Gestion Intention Remise Commerciale
        if (parsedIntent.type === 'discount') {
          updateCalculation(
            quote.items,
            quote.depositPercent,
            parsedIntent.discountType,
            parsedIntent.value,
            quote.photos
          );
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          setVoiceHint(`🎉 Remise de ${parsedIntent.value}${parsedIntent.discountType === 'percent' ? '%' : '€'} appliquée au devis !`);
          return;
        }

        // 2. Gestion Intention Acompte
        if (parsedIntent.type === 'deposit') {
          updateCalculation(
            quote.items,
            parsedIntent.percent,
            quote.discountType,
            quote.discountValue,
            quote.photos
          );
          setVoiceHint(`💰 Acompte configuré à ${parsedIntent.percent}%`);
          return;
        }

        // 3. Gestion Intention Client
        if (parsedIntent.type === 'client') {
          onUpdateQuote({
            ...quote,
            client: {
              ...quote.client,
              name: parsedIntent.name || quote.client.name,
              address: parsedIntent.address || quote.client.address,
            },
          });
          setVoiceHint(`👤 Client mis à jour : ${parsedIntent.name || 'Coordonnées'}`);
          return;
        }

        // 4. Gestion Intention Ligne de Prestation / Fourniture
        if (parsedIntent.type === 'item') {
          const itemData = parsedIntent.item;
          const newItem: QuoteItem = {
            id: 'voice-' + Date.now(),
            designation: itemData.designation || transcript,
            category: itemData.category || 'forfait',
            quantity: itemData.quantity || 1,
            unit: (itemData.unit as any) || 'forfait',
            unitPriceHT: itemData.unitPriceHT || 100,
            costPriceHT: (itemData.unitPriceHT || 100) * 0.4,
            vatRate: (itemData.vatRate as VatRate) || 10,
            totalHT: (itemData.quantity || 1) * (itemData.unitPriceHT || 100),
          };
          updateCalculation([...quote.items, newItem]);
          setVoiceHint(`✅ Ajouté : "${newItem.designation}" (${newItem.quantity} ${newItem.unit} à ${formatEuro(newItem.unitPriceHT)} HT)`);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Erreur captation vocale:", err);
        setIsListening(false);
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          setShowMicPermissionModal(true);
        } else {
          setVoiceHint("Erreur micro : vérifiez que le micro est autorisé.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setShowMicPermissionModal(true);
    }
  };

  const tradeFilters = [
    { id: 'all', label: 'Tout', icon: Layers },
    { id: 'plomberie', label: 'Plomberie', icon: Flame },
    { id: 'electricite', label: 'Électricité', icon: Zap },
    { id: 'serrurerie', label: 'Serrurerie', icon: Lock },
    { id: 'peinture', label: 'Peinture', icon: Paintbrush },
    { id: 'climatisation', label: 'Climatisation', icon: Snowflake },
  ];

  const filteredCatalog =
    selectedTrade === 'all'
      ? catalog
      : catalog.filter((item) => item.trade === selectedTrade);

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* Barre d'en-tête du devis rapide */}
      <div className="glass-panel p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                Devis <span className="text-amber-400 font-mono">{quote.number}</span>
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                quote.status === 'signe'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {quote.status === 'signe' ? 'Signé' : 'Brouillon'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {artisan.companyName} • Taux réf : {artisan.defaultHourlyRate || 60}€/h
            </p>
          </div>
        </div>

        {/* Bouton Dictée Vocale Express */}
        <button
          type="button"
          onClick={startSpeechRecognition}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition shadow-lg ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 glow-amber'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isListening ? "Écoute..." : "Dictée vocale (IA)"}
        </button>
      </div>

      {voiceHint && (
        <div className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{voiceHint}</span>
        </div>
      )}

      {/* Raccourcis Tactiles "Pouce & Chantier" */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Ajout 1-Clic :</span>
        <button
          type="button"
          onClick={() => handleAddQuickHour(1)}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition"
        >
          <Clock className="w-3 h-3 text-amber-400" /> +1h ({artisan.defaultHourlyRate || 60}€)
        </button>
        <button
          type="button"
          onClick={() => handleAddQuickHour(2)}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition"
        >
          <Clock className="w-3 h-3 text-amber-400" /> +2h ({(artisan.defaultHourlyRate || 60) * 2}€)
        </button>
        <button
          type="button"
          onClick={() => handleAddQuickHour(4)}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition"
        >
          <Clock className="w-3 h-3 text-amber-400" /> +Demi-j (4h)
        </button>
        <button
          type="button"
          onClick={handleAddQuickTravel}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition"
        >
          <Car className="w-3 h-3 text-sky-400" /> +Déplacement (50€)
        </button>
      </div>

      {/* Bloc Coordonnées Client & Adresse Chantier */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
          <User className="w-4 h-4 text-amber-400" />
          Client & Facturation
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-[10px] font-medium text-slate-400 block mb-1">Nom / Société du client</label>
            <input
              type="text"
              placeholder="Ex: M. Dupont Jean"
              value={quote.client.name}
              onChange={(e) => handleClientChange('name', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none transition"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-400 block mb-1">Téléphone mobile (SMS)</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="tel"
                placeholder="06 12 34 56 78"
                value={quote.client.phone}
                onChange={(e) => handleClientChange('phone', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 outline-none transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-400 block mb-1">Adresse (client / facturation)</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="12 rue de la Paix, 75002 Paris"
                value={quote.client.address}
                onChange={(e) => handleClientChange('address', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Case à cocher : Adresse du chantier différente */}
        <div className="pt-2 border-t border-slate-800/80">
          <label
            onClick={() => handleClientChange('isSiteAddressDifferent', !quote.client.isSiteAddressDifferent)}
            className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-amber-300 select-none py-1"
          >
            {quote.client.isSiteAddressDifferent ? (
              <CheckSquare className="w-4 h-4 text-amber-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span className="font-semibold">
              L'adresse du chantier est différente de l'adresse du client
            </span>
          </label>

          {/* Champs conditionnels pour l'adresse de chantier spécifique */}
          {quote.client.isSiteAddressDifferent && (
            <div className="mt-3 p-3.5 bg-slate-900/90 border border-amber-500/20 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Building className="w-3.5 h-3.5" />
                <span>Lieu d'exécution des travaux (Chantier)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Adresse du chantier</label>
                  <input
                    type="text"
                    placeholder="Ex: 45 boulevard Haussmann"
                    value={quote.client.siteAddress || ''}
                    onChange={(e) => handleClientChange('siteAddress', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Ville & Code Postal</label>
                  <input
                    type="text"
                    placeholder="75009 Paris"
                    value={quote.client.siteCity || ''}
                    onChange={(e) => handleClientChange('siteCity', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Accès / Digicode / Étage (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: Bât B, 3ème étage gauche, code 4812"
                    value={quote.client.siteAccessNotes || ''}
                    onChange={(e) => handleClientChange('siteAccessNotes', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Photos de Chantier */}
      <PhotoUploadSection
        photos={quote.photos || []}
        onChange={(photos) => updateCalculation(quote.items, quote.depositPercent, quote.discountType, quote.discountValue, photos)}
      />

      {/* Onglets Saisie / Catalogue rapide */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'editor'
                ? 'bg-amber-500 text-slate-950 shadow-md glow-amber'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Lignes ({quote.items.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950 shadow-md glow-amber'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Catalogue 1-Clic
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleAddItem()}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {/* Vue 1 : Liste des Lignes du Devis avec Stepper "+" et "-" Tactile */}
      {activeTab === 'editor' && (
        <div className="space-y-2.5">
          {quote.items.length === 0 ? (
            <div className="p-6 text-center glass-card rounded-2xl border-dashed border-2 border-slate-800">
              <p className="text-slate-400 text-xs mb-2.5">
                Aucune prestation ajoutée.
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-3.5 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow glow-amber"
              >
                Ouvrir le catalogue 1-Clic
              </button>
            </div>
          ) : (
            quote.items.map((item) => (
              <div
                key={item.id}
                className="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.designation}
                      onChange={(e) => handleItemChange(item.id, 'designation', e.target.value)}
                      placeholder="Désignation de la prestation / fourniture"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:border-amber-400 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Champs Chiffrage & Stepper Tactile Pouce Mobile-Friendly */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end text-xs">
                  {/* Stepper Quantité Tactile */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Quantité</label>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleIncrementQty(item.id, -1)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-transparent text-xs text-white font-mono text-center outline-none py-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleIncrementQty(item.id, 1)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Unité</label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-amber-400 outline-none"
                    >
                      <option value="forfait">Forfait</option>
                      <option value="u">Unité (u)</option>
                      <option value="h">Heure (h)</option>
                      <option value="m²">m²</option>
                      <option value="ml">Mètre lin. (ml)</option>
                      <option value="j">Jour (j)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Prix Unit. HT (€)</label>
                    <input
                      type="number"
                      step="any"
                      value={item.unitPriceHT}
                      onChange={(e) =>
                        handleItemChange(item.id, 'unitPriceHT', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-right focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Taux TVA</label>
                    <select
                      value={item.vatRate}
                      onChange={(e) =>
                        handleItemChange(item.id, 'vatRate', parseFloat(e.target.value) as VatRate)
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-amber-400 font-bold focus:border-amber-400 outline-none"
                    >
                      <option value={10}>10% (Rénov)</option>
                      <option value={20}>20% (Neuf)</option>
                      <option value={5.5}>5.5% (Éco)</option>
                      <option value={0}>0% (Exo)</option>
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between sm:flex-col sm:justify-center text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Total Ligne HT</span>
                    <span className="font-mono font-black text-amber-400 text-xs">
                      {formatEuro((item.quantity || 0) * (item.unitPriceHT || 0))}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Vue 2 : Catalogue 1-Clic Personnalisable */}
      {activeTab === 'catalog' && (
        <div className="space-y-3">
          {/* Barre d'action supérieure du catalogue */}
          <div className="flex items-center justify-between gap-2">
            {/* Filtres métiers */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar flex-1">
              {tradeFilters.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTrade(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition ${
                      selectedTrade === tab.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Actions Catalogue : Nouveau & Reset */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenNewCatalogItem}
                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 shadow transition glow-amber"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Créer prestation</span>
                <span className="sm:hidden">Créer</span>
              </button>

              <button
                type="button"
                onClick={handleResetCatalog}
                title="Restaurer le catalogue d'origine"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Message d'aide pour l'artisan */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>💡 Touchez pour ajouter au devis, ou cliquez sur ✏️ pour modifier la ligne</span>
            <span className="font-mono">{filteredCatalog.length} prestations</span>
          </div>

          {/* Grille de prestations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredCatalog.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleAddItem(preset)}
                className="p-3 rounded-xl glass-card border border-slate-800 hover:border-amber-500/50 cursor-pointer transition flex items-center justify-between group relative"
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition">
                      {preset.label}
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    TVA {preset.defaultVatRate} % • {preset.defaultUnit}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-amber-400 block">
                      {formatEuro(preset.defaultPriceHT)} HT
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-end gap-0.5">
                      <Plus className="w-3 h-3" /> Ajouter
                    </span>
                  </div>

                  {/* Bouton Crayon pour modifier la prestation en 1 clic */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditCatalogItem(preset, e)}
                    className="p-2 bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-slate-700 hover:border-amber-500/40 rounded-lg transition"
                    title="Modifier cette prestation dans le catalogue"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bloc Remise Commerciale & Marge Discrète */}
      <div className="glass-card p-3.5 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">Remise Commerciale (Négociation)</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => updateCalculation(quote.items, quote.depositPercent, 'percent', quote.discountValue)}
              className={`p-1 rounded text-xs font-bold ${
                quote.discountType === 'percent' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateCalculation(quote.items, quote.depositPercent, 'fixed', quote.discountValue)}
              className={`p-1 rounded text-xs font-bold ${
                quote.discountType === 'fixed' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Euro className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="any"
            placeholder={quote.discountType === 'percent' ? "Remise en % (ex: 5)" : "Remise en € (ex: 50)"}
            value={quote.discountValue || ''}
            onChange={(e) =>
              updateCalculation(
                quote.items,
                quote.depositPercent,
                quote.discountType,
                parseFloat(e.target.value) || 0
              )
            }
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-400 outline-none"
          />
          {quote.discountAmountHT > 0 && (
            <span className="text-xs font-bold text-rose-400 font-mono">
              -{formatEuro(quote.discountAmountHT)} HT
            </span>
          )}
        </div>

        {/* Marge Discrète toggle */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => setShowMargin(!showMargin)}
            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
          >
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            {showMargin ? "Masquer marge estimée" : "Afficher marge discrète (Artisan)"}
          </button>
          {showMargin && (
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Marge brute : ~{formatEuro(quote.estimatedMarginHT || (quote.totalHT * 0.65))} HT
            </span>
          )}
        </div>
      </div>

      {/* Réglage du taux d'acompte */}
      <div className="glass-card p-3.5 rounded-xl flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-200">Acompte à la signature</span>
          <p className="text-[10px] text-slate-400">Versement de blocage du chantier</p>
        </div>
        <div className="flex items-center gap-1.5">
          {[20, 30, 40, 50].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => updateCalculation(quote.items, pct)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition ${
                quote.depositPercent === pct
                  ? 'bg-amber-500 text-slate-950 glow-amber'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {pct} %
            </button>
          ))}
        </div>
      </div>

      {/* Barre d'Action Flottante en Bas pour Smartphone */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Récap Totaux */}
          <div>
            <span className="text-[9px] text-slate-400 font-semibold block uppercase">Total TTC</span>
            <span className="font-mono font-black text-amber-400 text-base sm:text-lg">
              {formatEuro(quote.totalTTC)}
            </span>
          </div>

          {/* Boutons d'Action Clés */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition"
              title="Envoyer le devis par WhatsApp, SMS ou Email"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>

            <button
              type="button"
              onClick={onOpenPreview}
              className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Aperçu PDF
            </button>

            <button
              type="button"
              onClick={onOpenSignature}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-lg glow-amber"
            >
              <PenTool className="w-3.5 h-3.5" />
              {quote.signatureDataUrl ? 'Signé' : 'Faire signer'}
            </button>
          </div>
        </div>
      </div>

      {/* Modale d'autorisation Microphone */}
      <MicrophonePermissionModal
        isOpen={showMicPermissionModal}
        onClose={() => setShowMicPermissionModal(false)}
        onPermissionGranted={() => {
          setTimeout(() => startSpeechRecognition(), 300);
        }}
      />

      {/* Modale de Personnalisation / Ajout d'élément de Catalogue */}
      <CatalogItemModal
        item={editingCatalogItem}
        isOpen={isCatalogModalOpen}
        onClose={() => {
          setIsCatalogModalOpen(false);
          setEditingCatalogItem(null);
        }}
        onSave={handleSaveCatalogItem}
        onDelete={handleDeleteCatalogItem}
      />

      {/* Modale d'Envoi 1-Clic WhatsApp / SMS / Email */}
      <ShareModal
        quote={quote}
        artisan={artisan}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onOpenPreview={onOpenPreview}
      />
    </div>
  );
};
