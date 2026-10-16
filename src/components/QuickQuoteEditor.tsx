import React, { useState, useRef, useEffect } from 'react';
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
import { calculateTotals, formatEuro, groupItemsByRoom } from '../utils/calculator';
import { parseContinuousVoiceSpeech } from '../utils/voiceParser';
import { MicrophonePermissionModal } from './MicrophonePermissionModal';
import { PhotoUploadSection } from './PhotoUploadSection';
import { CatalogItemModal } from './CatalogItemModal';
import { ShareModal } from './ShareModal';
import {
  Mic,
  MicOff,
  Check,
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
  CreditCard,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickQuoteEditorProps {
  quote: Quote;
  artisan: ArtisanProfile;
  onUpdateQuote: (updatedQuote: Quote) => void;
  onOpenSignature: () => void;
  onOpenPreview: () => void;
  onOpenPayment?: () => void;
  onOpenClientSign?: () => void;
  onConvertToInvoice?: (type: 'acompte' | 'solde') => void;
  onOpenSettings?: () => void;
}

export const QuickQuoteEditor: React.FC<QuickQuoteEditorProps> = ({
  quote,
  artisan,
  onUpdateQuote,
  onOpenSignature,
  onOpenPreview,
  onOpenPayment,
  onOpenClientSign,
  onConvertToInvoice,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'catalog'>('editor');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [isRecording, setIsRecording] = useState(false);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const [liveInterim, setLiveInterim] = useState('');
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);
  const [showMargin, setShowMargin] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const fullTranscriptRef = useRef('');

  // Nettoyage de l'instance SpeechRecognition en cas de démontage
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
    };
  }, []);

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

  const handlePhotosChange = (newPhotos: QuotePhoto[]) => {
    onUpdateQuote({
      ...quote,
      photos: newPhotos,
    });
  };

  const handleAddQuickTravel = () => {
    const travelFee = artisan.defaultTravelFee ?? 50;
    const newItem: QuoteItem = {
      id: 'item-travel-' + Date.now(),
      designation: 'Forfait déplacement & prise en charge chantier',
      category: 'deplacement',
      quantity: 1,
      unit: 'forfait',
      unitPriceHT: travelFee,
      costPriceHT: travelFee * 0.3,
      vatRate: 10,
      totalHT: travelFee,
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

  // Reconnaissance vocale Web Speech API en mode continu (Bouton ON / OFF)
  // L'artisan enclenche (ON), parle librement tout son devis, puis coupe (OFF) pour dispatcher
  const toggleContinuousDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setShowMicPermissionModal(true);
      return;
    }

    // SI DÉJÀ ENREGISTREMENT EN COURS : CLIC "OFF" -> ARRÊT ET DISPATCH
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      setIsRecording(false);

      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch (e) {
        console.warn("Erreur stop recognition:", e);
      }

      // Concaténation de tout ce qui a été dit
      const completeSpokenText = (fullTranscriptRef.current + ' ' + liveInterim).trim();

      if (!completeSpokenText) {
        setVoiceHint("ℹ️ Aucune parole n'a été détectée. Réessayez en parlant distinctement.");
        setLiveInterim('');
        return;
      }

      // Analyse globale multi-intentions (prestations, pièces, remises, acompte, client)
      const dispatch = parseContinuousVoiceSpeech(completeSpokenText);

      // 1. Ajout de toutes les lignes reconnues
      let nextItems = [...quote.items];
      if (dispatch.items.length > 0) {
        const newQuoteItems: QuoteItem[] = dispatch.items.map((item, idx) => {
          const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
          const unitPrice = item.unitPriceHT && item.unitPriceHT > 0 ? item.unitPriceHT : (artisan.defaultHourlyRate || 60);
          return {
            id: 'voice-' + Date.now() + '-' + idx,
            designation: item.designation || 'Prestation chantier',
            category: item.category || 'forfait',
            quantity: qty,
            unit: (item.unit as any) || 'forfait',
            unitPriceHT: unitPrice,
            costPriceHT: unitPrice * 0.4,
            vatRate: (item.vatRate as VatRate) || 10,
            room: item.room,
            totalHT: qty * unitPrice,
          };
        });
        nextItems = [...nextItems, ...newQuoteItems];
      }

      // 2. Gestion de la Remise si dictée
      const nextDiscountType = dispatch.discount ? dispatch.discount.discountType : quote.discountType;
      const nextDiscountVal = dispatch.discount ? dispatch.discount.value : quote.discountValue;

      // 3. Gestion de l'Acompte si dicté
      const nextDeposit = dispatch.depositPercent !== undefined ? dispatch.depositPercent : quote.depositPercent;

      // 4. Gestion du Client si dicté
      let nextClient = { ...quote.client };
      if (dispatch.client?.name) nextClient.name = dispatch.client.name;
      if (dispatch.client?.address) nextClient.address = dispatch.client.address;

      // Application immédiate
      onUpdateQuote({
        ...quote,
        client: nextClient,
      });
      updateCalculation(nextItems, nextDeposit, nextDiscountType, nextDiscountVal, quote.photos);

      if (dispatch.items.length > 0 || dispatch.discount || dispatch.depositPercent !== undefined) {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      }

      setVoiceHint(dispatch.summary);
      setLiveInterim('');
      setAccumulatedTranscript('');
      fullTranscriptRef.current = '';
      return;
    }

    // SI MICRO ARRÊTÉ : CLIC "ON" -> DÉMARRAGE DE L'ÉCOUTE CONTINUE
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      fullTranscriptRef.current = '';
      setAccumulatedTranscript('');
      setLiveInterim('');
      setVoiceHint("🔴 Dictée active : parlez librement. Cliquez sur 'Arrêter la dictée' quand vous avez fini.");

      recognition.onstart = () => {
        isRecordingRef.current = true;
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            fullTranscriptRef.current += (fullTranscriptRef.current ? ' ' : '') + trans.trim();
            setAccumulatedTranscript(fullTranscriptRef.current);
          } else {
            currentInterim += trans;
          }
        }
        setLiveInterim(currentInterim);
      };

      recognition.onerror = (err: any) => {
        console.warn("Erreur captation vocale continue:", err);
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          isRecordingRef.current = false;
          setIsRecording(false);
          setShowMicPermissionModal(true);
        }
      };

      recognition.onend = () => {
        // Si l'utilisateur n'a pas appuyé sur OFF, redémarrage automatique en cas de pause
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Déjà actif
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      isRecordingRef.current = true;
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      isRecordingRef.current = false;
      setIsRecording(false);
      setShowMicPermissionModal(true);
    }
  };

  const cancelDictation = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
    setLiveInterim('');
    setAccumulatedTranscript('');
    fullTranscriptRef.current = '';
    setVoiceHint("Dictée annulée.");
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Devis N°</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={quote.number}
                  onChange={(e) => onUpdateQuote({ ...quote, number: e.target.value })}
                  placeholder="DEV-2026-001"
                  title="Cliquez pour modifier le numéro du devis"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-2.5 pr-7 py-1 text-sm font-black text-amber-700 dark:text-amber-400 font-mono tracking-wide focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none shadow-xs w-36 sm:w-44 transition"
                />
                <Pencil className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                quote.status === 'signe'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              }`}>
                {quote.status === 'signe' ? 'Signé' : 'Brouillon'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{artisan.companyName}</span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              {onOpenSettings ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    title="Modifier votre taux horaire dans les réglages"
                    className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 transition"
                  >
                    <Clock className="w-3 h-3 text-amber-500" />
                    Taux : {artisan.defaultHourlyRate || 60}€/h
                  </button>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    title="Modifier vos frais de déplacement dans les réglages"
                    className="text-[11px] text-sky-700 dark:text-sky-400 hover:underline font-bold flex items-center gap-1 transition"
                  >
                    <Car className="w-3 h-3 text-sky-500" />
                    Dépl : {artisan.defaultTravelFee ?? 50}€
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Taux : {artisan.defaultHourlyRate || 60}€/h</span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Dépl : {artisan.defaultTravelFee ?? 50}€</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bouton ON / OFF Dictée Vocale Continue Express */}
        <button
          type="button"
          onClick={toggleContinuousDictation}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs transition shadow-md ${
            isRecording
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-400/80 shadow-rose-600/30'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 glow-amber'
          }`}
          title={isRecording ? "Arrêter l'enregistrement et dispatcher tout le devis" : "Activer la dictée vocale continue"}
        >
          {isRecording ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <MicOff className="w-4 h-4" />
              <span>Arrêter la dictée (OFF)</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Dictée vocale continue</span>
              <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-black uppercase">ON</span>
            </>
          )}
        </button>
      </div>

      {/* Panneau de Dictée Vocale Continue en Temps Réel */}
      {isRecording && (
        <div className="p-4 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-500/40 rounded-2xl space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                Micro Ouvert • En écoute continue...
              </span>
            </div>
            <button
              type="button"
              onClick={cancelDictation}
              className="text-[11px] font-bold text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
            >
              Annuler
            </button>
          </div>

          {/* Affichage des paroles en direct */}
          <div className="min-h-16 max-h-36 overflow-y-auto p-3 bg-white dark:bg-slate-950 rounded-xl border border-rose-200 dark:border-rose-900/40 text-slate-900 dark:text-white text-xs leading-relaxed font-medium custom-scrollbar">
            {(accumulatedTranscript + ' ' + liveInterim).trim() ? (
              <span>
                <strong>{accumulatedTranscript}</strong>
                <span className="text-amber-600 dark:text-amber-400 font-bold italic ml-1">{liveInterim}</span>
              </span>
            ) : (
              <span className="italic text-slate-400">
                🎙️ Parlez naturellement : dictez vos pièces, prestations, quantités, forfaits, remise ou acompte...
              </span>
            )}
          </div>

          {/* Conseils & Bouton Terminer (OFF) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              💡 <em>Exemple : "Cuisine pose mitigeur 150€, salle de bain 2h de main d'oeuvre, déplacement 50€, remise 5%"</em>
            </p>
            <button
              type="button"
              onClick={toggleContinuousDictation}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition hover:scale-[1.02]"
            >
              <Check className="w-4 h-4" />
              <span>Valider & Remplir le Devis (OFF)</span>
            </button>
          </div>
        </div>
      )}

      {/* Bannière Facturation de Solde Rapide */}
      {quote.docType === 'facture_solde' ? (
        <div className="px-4 py-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-300 block">Facture de Solde Définitive</span>
              <span className="text-[11px] text-slate-300">
                N° <strong className="font-mono text-white">{quote.invoiceNumber}</strong> • Déduction d'acompte incluse
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenPreview}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow flex items-center gap-1 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Voir Facture
          </button>
        </div>
      ) : (quote.status === 'signe' || quote.status === 'acompte_paye') && onConvertToInvoice ? (
        <div className="px-4 py-3 bg-gradient-to-r from-blue-900/40 to-slate-800 border border-blue-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Chantier validé par le client</span>
              <span className="text-[11px] text-slate-300">
                Travaux terminés ? Générez la facture de solde avec déduction de l'acompte.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onConvertToInvoice('solde')}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition hover:scale-105"
          >
            <Receipt className="w-4 h-4" />
            <span>Facturer le Solde (1 Clic)</span>
          </button>
        </div>
      ) : null}

      {voiceHint && !isRecording && (
        <div className="px-3.5 py-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 font-medium flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{voiceHint}</span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceHint(null)}
            className="text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-white text-xs font-bold px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Raccourcis Tactiles "Pouce & Chantier" */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase shrink-0">Ajout 1-Clic :</span>
        <button
          type="button"
          onClick={() => handleAddQuickHour(1)}
          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
        >
          <Clock className="w-3 h-3 text-amber-500" /> +1h ({artisan.defaultHourlyRate || 60}€)
        </button>
        <button
          type="button"
          onClick={() => handleAddQuickHour(2)}
          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
        >
          <Clock className="w-3 h-3 text-amber-500" /> +2h ({(artisan.defaultHourlyRate || 60) * 2}€)
        </button>
        <button
          type="button"
          onClick={() => handleAddQuickHour(4)}
          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
        >
          <Clock className="w-3 h-3 text-amber-500" /> +Demi-j (4h)
        </button>
        <button
          type="button"
          onClick={handleAddQuickTravel}
          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-sm"
        >
          <Car className="w-3 h-3 text-sky-500" /> +Déplacement ({artisan.defaultTravelFee ?? 50}€)
        </button>
      </div>

      {/* Bloc Coordonnées Client & Adresse Chantier */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
          <User className="w-4 h-4 text-amber-500" />
          Client & Facturation
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nom / Société du client</label>
            <input
              type="text"
              placeholder="Ex: M. Dupont Jean"
              value={quote.client.name}
              onChange={(e) => handleClientChange('name', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none transition shadow-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Téléphone mobile (SMS)</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="tel"
                placeholder="06 12 34 56 78"
                value={quote.client.phone}
                onChange={(e) => handleClientChange('phone', e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none transition font-mono shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Adresse (client / facturation)</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="12 rue de la Paix, 75002 Paris"
                value={quote.client.address}
                onChange={(e) => handleClientChange('address', e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none transition shadow-xs"
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
            <div className="mt-3 p-3.5 bg-amber-50/70 dark:bg-slate-900/90 border border-amber-300 dark:border-amber-500/20 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Building className="w-3.5 h-3.5" />
                <span>Lieu d'exécution des travaux (Chantier)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">Adresse du chantier</label>
                  <input
                    type="text"
                    placeholder="Ex: 45 boulevard Haussmann"
                    value={quote.client.siteAddress || ''}
                    onChange={(e) => handleClientChange('siteAddress', e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">Ville & Code Postal</label>
                  <input
                    type="text"
                    placeholder="75009 Paris"
                    value={quote.client.siteCity || ''}
                    onChange={(e) => handleClientChange('siteCity', e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none shadow-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">Accès / Digicode / Étage (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: Bât B, 3ème étage gauche, code 4812"
                    value={quote.client.siteAccessNotes || ''}
                    onChange={(e) => handleClientChange('siteAccessNotes', e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none shadow-xs"
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
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'editor'
                ? 'bg-amber-500 text-slate-950 shadow-md glow-amber'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
            }`}
          >
            Lignes ({quote.items.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950 shadow-md glow-amber'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Catalogue 1-Clic
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleAddItem()}
          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {/* Vue 1 : Liste des Lignes du Devis avec Stepper "+" et "-" Tactile */}
      {activeTab === 'editor' && (
        <div className="space-y-2.5">
          {/* Synthèse par Pièce / Zone si présente */}
          {quote.items.some((i) => i.room) && (
            <div className="p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar text-xs shadow-xs">
              <span className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase shrink-0">Sous-totaux Zones :</span>
              {groupItemsByRoom(quote.items).map((g) => (
                <div
                  key={g.roomName}
                  className="px-2.5 py-1 rounded-lg bg-amber-50/70 dark:bg-slate-800/90 border border-amber-200 dark:border-slate-700/60 shrink-0 flex items-center gap-1.5"
                >
                  <span className="text-slate-800 dark:text-slate-300 font-semibold">{g.roomName} :</span>
                  <span className="font-mono font-black text-amber-700 dark:text-amber-400">{formatEuro(g.totalTTC)}</span>
                </div>
              ))}
            </div>
          )}

          {quote.items.length === 0 ? (
            <div className="p-6 text-center glass-card rounded-2xl border-dashed border-2 border-slate-300 dark:border-slate-800">
              <p className="text-slate-600 dark:text-slate-400 text-xs mb-2.5">
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
                className="glass-card p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 dark:hover:border-slate-700 transition space-y-2.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.designation}
                      onChange={(e) => handleItemChange(item.id, 'designation', e.target.value)}
                      placeholder="Désignation de la prestation / fourniture"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 outline-none shadow-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Ligne 2 : Sélection de la Pièce / Zone */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold shrink-0">Zone / Pièce :</span>
                  <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                    {['Général', 'Cuisine', 'Salle de bain', 'Salon', 'Chambre', 'WC', 'Extérieur'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleItemChange(item.id, 'room', r === 'Général' ? undefined : r)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                          (item.room === r || (!item.room && r === 'Général'))
                            ? 'bg-amber-500 text-slate-950 font-black shadow-xs ring-1 ring-amber-600/30'
                            : 'bg-white hover:bg-amber-50/50 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 shadow-xs'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                    <input
                      type="text"
                      placeholder="Autre pièce..."
                      value={item.room && !['Cuisine', 'Salle de bain', 'Salon', 'Chambre', 'WC', 'Extérieur'].includes(item.room) ? item.room : ''}
                      onChange={(e) => handleItemChange(item.id, 'room', e.target.value || undefined)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-900 dark:text-white font-medium w-28 outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                {/* Champs Chiffrage & Stepper Tactile Pouce Mobile-Friendly */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end text-xs">
                  {/* Stepper Quantité Tactile */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Quantité</label>
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleIncrementQty(item.id, -1)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition text-xs font-bold"
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
                        className="w-full bg-transparent text-xs text-slate-900 dark:text-white font-mono font-bold text-center outline-none py-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleIncrementQty(item.id, 1)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Unité</label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:border-amber-500 outline-none shadow-xs"
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
                    <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Prix Unit. HT (€)</label>
                    <input
                      type="number"
                      step="any"
                      value={item.unitPriceHT}
                      onChange={(e) =>
                        handleItemChange(item.id, 'unitPriceHT', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white font-mono font-bold text-right focus:border-amber-500 outline-none shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Taux TVA</label>
                    <select
                      value={item.vatRate}
                      onChange={(e) =>
                        handleItemChange(item.id, 'vatRate', parseFloat(e.target.value) as VatRate)
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400 font-bold focus:border-amber-500 outline-none shadow-xs"
                    >
                      <option value={10}>10% (Rénov)</option>
                      <option value={20}>20% (Neuf)</option>
                      <option value={5.5}>5.5% (Éco)</option>
                      <option value={0}>0% (Exo)</option>
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1 bg-amber-50/80 dark:bg-slate-900/90 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-slate-800 flex items-center justify-between sm:flex-col sm:justify-center text-right shadow-xs">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase">Total Ligne HT</span>
                    <span className="font-mono font-black text-amber-700 dark:text-amber-400 text-xs">
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
                      selectedTrade === tab.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700'
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
                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1 shadow transition glow-amber"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Créer prestation</span>
                <span className="sm:hidden">Créer</span>
              </button>

              <button
                type="button"
                onClick={handleResetCatalog}
                title="Restaurer le catalogue d'origine"
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white rounded-xl border border-slate-300 dark:border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Message d'aide pour l'artisan */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 px-1 font-medium">
            <span>💡 Touchez pour ajouter au devis, ou cliquez sur ✏️ pour modifier la ligne</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{filteredCatalog.length} prestations</span>
          </div>

          {/* Grille de prestations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredCatalog.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleAddItem(preset)}
                className="p-3 rounded-xl glass-card border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 cursor-pointer transition flex items-center justify-between group relative shadow-xs"
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      {preset.label}
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                    TVA {preset.defaultVatRate} % • {preset.defaultUnit}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-black text-xs text-amber-700 dark:text-amber-400 block">
                      {formatEuro(preset.defaultPriceHT)} HT
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-end gap-0.5">
                      <Plus className="w-3 h-3" /> Ajouter
                    </span>
                  </div>

                  {/* Bouton Crayon pour modifier la prestation en 1 clic */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditCatalogItem(preset, e)}
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300/80 hover:border-amber-400 dark:bg-slate-800 dark:hover:bg-amber-500/20 dark:text-slate-300 dark:hover:text-amber-400 dark:border-slate-700 rounded-lg transition shadow-xs"
                    title="Modifier cette prestation dans le catalogue"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Photos de Chantier & Constats */}
      <PhotoUploadSection
        photos={quote.photos || []}
        onChange={handlePhotosChange}
      />

      {/* Bloc Remise Commerciale & Marge Discrète */}
      <div className="glass-card p-3.5 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Remise Commerciale (Négociation)</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => updateCalculation(quote.items, quote.depositPercent, 'percent', quote.discountValue)}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                quote.discountType === 'percent'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateCalculation(quote.items, quote.depositPercent, 'fixed', quote.discountValue)}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                quote.discountType === 'fixed'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-400'
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
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono font-bold focus:border-amber-500 outline-none shadow-xs"
          />
          {quote.discountAmountHT > 0 && (
            <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
              -{formatEuro(quote.discountAmountHT)} HT
            </span>
          )}
        </div>

        {/* Marge Discrète toggle */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => setShowMargin(!showMargin)}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 font-medium transition"
          >
            <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            {showMargin ? "Masquer marge estimée" : "Afficher marge discrète (Artisan)"}
          </button>
          {showMargin && (
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Marge brute : ~{formatEuro(quote.estimatedMarginHT || (quote.totalHT * 0.65))} HT
            </span>
          )}
        </div>
      </div>

      {/* Réglage du taux d'acompte & Encaissement Direct */}
      <div className="glass-card p-3.5 rounded-xl space-y-2.5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Acompte à la signature</span>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">Versement de blocage du chantier</p>
          </div>
          <div className="flex items-center gap-1.5">
            {[20, 30, 40, 50].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => updateCalculation(quote.items, pct)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  quote.depositPercent === pct
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs ring-1 ring-amber-600/30'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-xs'
                }`}
              >
                {pct} %
              </button>
            ))}
          </div>
        </div>

        {onOpenPayment && quote.depositAmountTTC > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-700 dark:text-slate-300">
              Acompte calculé : <strong className="text-amber-700 dark:text-amber-400 font-mono">{formatEuro(quote.depositAmountTTC)} TTC</strong>
            </div>
            <button
              type="button"
              onClick={onOpenPayment}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow glow-amber transition"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Encaisser Acompte (QR / CB)</span>
            </button>
          </div>
        )}
      </div>

      {/* Barre d'Action Flottante en Bas pour Smartphone */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Récap Totaux */}
          <div>
            <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold block uppercase">Total TTC</span>
            <span className="font-mono font-black text-amber-700 dark:text-amber-400 text-base sm:text-lg">
              {formatEuro(quote.totalTTC)}
            </span>
          </div>

          {/* Boutons d'Action Clés */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
              title="Envoyer le devis par WhatsApp, SMS ou Email"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>

            <button
              type="button"
              onClick={onOpenPreview}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
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
          setTimeout(() => toggleContinuousDictation(), 300);
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
        onOpenClientSign={onOpenClientSign}
      />
    </div>
  );
};
