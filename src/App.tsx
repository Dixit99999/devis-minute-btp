import { useState, useEffect } from 'react';
import type {
  Quote,
  ArtisanProfile,
  QuoteItem,
} from './types';
import { INITIAL_ARTISAN_PROFILE } from './data/presets';
import { calculateTotals, generateQuoteNumber, generateInvoiceNumber } from './utils/calculator';
import { QuickQuoteEditor } from './components/QuickQuoteEditor';
import { QuoteList } from './components/QuoteList';
import { ArtisanSettings } from './components/ArtisanSettings';
import { SignaturePad } from './components/SignaturePad';
import { QuotePDFModal } from './components/QuotePDFModal';
import { PaymentModal } from './components/PaymentModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import {
  FileText,
  ListFilter,
  Building2,
  Zap,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY_ARTISAN = 'devis_minute_artisan_profile';
const STORAGE_KEY_QUOTES = 'devis_minute_quotes_list';
const STORAGE_KEY_USER_EMAIL = 'devis_minute_user_email';

export function App() {
  // Profil Artisan persistant
  const [artisan, setArtisan] = useState<ArtisanProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ARTISAN);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {
      ...INITIAL_ARTISAN_PROFILE,
      defaultHourlyRate: 60,
      isOnboarded: true,
    };
  });

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_USER_EMAIL) || null;
  });

  // Liste de devis persistante
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_QUOTES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }

    // Exemple initial
    const initialItems: QuoteItem[] = [
      {
        id: 'item-1',
        designation: 'Remplacement chauffe-eau électrique 200L vertical blindé',
        category: 'fourniture',
        quantity: 1,
        unit: 'u',
        unitPriceHT: 680,
        costPriceHT: 350,
        vatRate: 10,
        totalHT: 680,
      },
      {
        id: 'item-2',
        designation: 'Dépose de l\'ancien ballon et raccordements hydrauliques cuivre',
        category: 'main_d_oeuvre',
        quantity: 1,
        unit: 'forfait',
        unitPriceHT: 280,
        costPriceHT: 60,
        vatRate: 10,
        totalHT: 280,
      },
      {
        id: 'item-3',
        designation: 'Forfait déplacement et évacuation des gravats / ferraille',
        category: 'deplacement',
        quantity: 1,
        unit: 'forfait',
        unitPriceHT: 85,
        costPriceHT: 20,
        vatRate: 10,
        totalHT: 85,
      },
    ];

    const totals = calculateTotals(initialItems, 30, 'percent', 0);

    const initialQuote: Quote = {
      id: 'quote-sample-1',
      number: 'DEV-2026-001',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      status: 'brouillon',
      docType: 'devis',
      client: {
        name: 'M. Philippe Martin',
        phone: '06 98 76 54 32',
        email: 'p.martin@gmail.com',
        address: '24 Avenue de la République',
        city: 'Paris',
        postalCode: '75011',
      },
      items: initialItems,
      discountType: 'percent',
      discountValue: 0,
      depositPercent: 30,
      ...totals,
    };

    return [initialQuote];
  });

  // Devis actif en cours d'édition
  const [currentQuote, setCurrentQuote] = useState<Quote>(() => quotes[0]);

  // Onglet courant : 'editor' | 'list' | 'settings'
  const [activeView, setActiveView] = useState<'editor' | 'list' | 'settings'>('editor');

  // Modales
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isPDFOpen, setIsPDFOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!artisan.isOnboarded);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);

  // Sauvegarde locale Offline-First
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ARTISAN, JSON.stringify(artisan));
  }, [artisan]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(STORAGE_KEY_USER_EMAIL, userEmail);
    }
  }, [userEmail]);

  const handleUpdateCurrentQuote = (updatedQuote: Quote) => {
    setCurrentQuote(updatedQuote);
    setQuotes((prev) =>
      prev.map((q) => (q.id === updatedQuote.id ? updatedQuote : q))
    );
  };

  const handleCreateNewQuote = () => {
    const newNumber = generateQuoteNumber(quotes.length);
    const newQuote: Quote = {
      id: 'quote-' + Date.now(),
      number: newNumber,
      docType: 'devis',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      status: 'brouillon',
      client: {
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
      },
      items: [],
      discountType: 'percent',
      discountValue: 0,
      depositPercent: 30,
      ...calculateTotals([], 30, 'percent', 0),
    };

    setQuotes((prev) => [newQuote, ...prev]);
    setCurrentQuote(newQuote);
    setActiveView('editor');
  };

  const handleSignatureSaved = (signatureDataUrl: string) => {
    const updated: Quote = {
      ...currentQuote,
      signatureDataUrl,
      signedAt: new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: 'signe',
    };
    handleUpdateCurrentQuote(updated);
    setIsSignatureOpen(false);
    setIsPDFOpen(true);
  };

  const handlePaymentSuccess = (quoteId: string) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: 'acompte_paye' } : q))
    );
    if (currentQuote.id === quoteId) {
      setCurrentQuote((prev) => ({ ...prev, status: 'acompte_paye' }));
    }
  };

  const handleConvertToInvoice = (type: 'acompte' | 'solde') => {
    const invoiceNum = generateInvoiceNumber(quotes.length, type);
    const updated: Quote = {
      ...currentQuote,
      docType: type === 'acompte' ? 'facture_acompte' : 'facture_solde',
      invoiceNumber: invoiceNum,
      status: type === 'acompte' ? 'facture_acompte' : 'facture_solde',
    };

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });

    handleUpdateCurrentQuote(updated);
  };

  const handleOnboardingComplete = (completedProfile: ArtisanProfile) => {
    setArtisan(completedProfile);
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Top Bar Mobile-Optimized */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md glow-amber">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="font-black text-white text-sm tracking-tight">
              DEVIS<span className="text-amber-400">MIN</span>UTE
            </span>
          </div>

          {/* Navigation Links Compacts */}
          <nav className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveView('editor')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                activeView === 'editor'
                  ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Devis</span>
            </button>

            <button
              onClick={() => setActiveView('list')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                activeView === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Chantiers</span>
            </button>

            <button
              onClick={() => setActiveView('settings')}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                activeView === 'settings'
                  ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Mon Entreprise"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profil</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeView === 'editor' && (
          <QuickQuoteEditor
            quote={currentQuote}
            artisan={artisan}
            onUpdateQuote={handleUpdateCurrentQuote}
            onOpenSignature={() => setIsSignatureOpen(true)}
            onOpenPreview={() => setIsPDFOpen(true)}
          />
        )}

        {activeView === 'list' && (
          <QuoteList
            quotes={quotes}
            artisan={artisan}
            onSelectQuote={(q) => {
              setCurrentQuote(q);
              setActiveView('editor');
            }}
            onCreateNewQuote={handleCreateNewQuote}
            onOpenPDF={(q) => {
              setCurrentQuote(q);
              setIsPDFOpen(true);
            }}
            onOpenPayment={(q) => {
              setCurrentQuote(q);
              setIsPaymentOpen(true);
            }}
          />
        )}

        {activeView === 'settings' && (
          <div className="space-y-4">
            {/* Bannière Abonnement & Compte Cloud */}
            <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 rounded-xl text-slate-950">
                  <Sparkles className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white">
                    {userEmail ? `Connecté : ${userEmail}` : 'Mode Découverte 14 Jours'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Abonnement Pro Artisan (59€/m) • Synchronisation Cloud & Acomptes CB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!userEmail && (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition"
                  >
                    Se connecter
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow glow-amber transition"
                >
                  Mon Forfait
                </button>
              </div>
            </div>

            <ArtisanSettings
              profile={artisan}
              onSave={(updated) => setArtisan(updated)}
            />
          </div>
        )}
      </main>

      {/* Modale Onboarding */}
      {showOnboarding && (
        <OnboardingModal
          initialProfile={artisan}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Modale Authentification */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(email) => setUserEmail(email)}
      />

      {/* Modale Abonnement Stripe */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        userEmail={userEmail || undefined}
      />

      {/* Modale Signature Tactile */}
      {isSignatureOpen && (
        <SignaturePad
          clientName={currentQuote.client.name}
          totalTTC={currentQuote.totalTTC}
          onSave={handleSignatureSaved}
          onClose={() => setIsSignatureOpen(false)}
        />
      )}

      {/* Modale PDF A4 & Partage / Facturation */}
      {isPDFOpen && (
        <QuotePDFModal
          quote={currentQuote}
          artisan={artisan}
          onClose={() => setIsPDFOpen(false)}
          onOpenPayment={() => {
            setIsPDFOpen(false);
            setIsPaymentOpen(true);
          }}
          onConvertToInvoice={handleConvertToInvoice}
        />
      )}

      {/* Modale Encaissement Acompte */}
      {isPaymentOpen && (
        <PaymentModal
          quote={currentQuote}
          artisan={artisan}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setIsPaymentOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
