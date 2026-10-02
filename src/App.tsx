import { useState, useEffect } from 'react';
import type {
  Quote,
  ArtisanProfile,
  QuoteItem,
} from './types';
import { INITIAL_ARTISAN_PROFILE } from './data/presets';
import { calculateTotals, generateQuoteNumber, generateInvoiceNumber, generateCreditNoteNumber } from './utils/calculator';
import { QuickQuoteEditor } from './components/QuickQuoteEditor';
import { QuoteList } from './components/QuoteList';
import { ArtisanSettings } from './components/ArtisanSettings';
import { SignaturePad } from './components/SignaturePad';
import { QuotePDFModal } from './components/QuotePDFModal';
import { PaymentModal } from './components/PaymentModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InstallPwaModal } from './components/InstallPwaModal';
import { LandingPage } from './components/LandingPage';
import { LegalModal } from './components/LegalModal';
import { ClientSignView } from './components/ClientSignView';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import {
  syncQuoteToCloud,
  fetchQuotesFromCloud,
  syncProfileToCloud,
  fetchProfileFromCloud,
} from './services/syncService';
import {
  FileText,
  ListFilter,
  Building2,
  Sparkles,
  Smartphone,
  Sun,
  Moon,
  BellRing,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY_ARTISAN = 'devis_minute_artisan_profile';
const STORAGE_KEY_QUOTES = 'devis_minute_quotes_list';
const STORAGE_KEY_USER_EMAIL = 'devis_minute_user_email';
const STORAGE_KEY_THEME = 'devis_minute_theme';

export function App() {
  // Thème Sombre / Clair (Haute Visibilité Chantier)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

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
      sendSmsOnSign: true,
      sendEmailOnSign: true,
      notificationPhone: '06 12 34 56 78',
    };
  });

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_USER_EMAIL) || null;
  });
  const [userId, setUserId] = useState<string | null>(null);

  // Synchronisation avec Supabase Auth & Cloud Database
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email || null);
          fetchProfileFromCloud(session.user.id).then((cloudProfile) => {
            if (cloudProfile) setArtisan((prev) => ({ ...prev, ...cloudProfile }));
          });
          fetchQuotesFromCloud(session.user.id).then((cloudQuotes) => {
            if (cloudQuotes && cloudQuotes.length > 0) {
              setQuotes(cloudQuotes);
              setCurrentQuote(cloudQuotes[0]);
            }
          });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email || null);
        } else {
          setUserId(null);
          setUserEmail(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Notification Toast Instantanée (Simulation SMS / Email reçu)
  const [activeAlert, setActiveAlert] = useState<{ title: string; message: string; type: 'sms' | 'email' | 'info' } | null>(null);

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
        room: 'Salle de bain',
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
        room: 'Salle de bain',
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
        room: 'Prestations Générales',
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

  // Onglet courant : 'landing' | 'editor' | 'list' | 'settings'
  const [activeView, setActiveView] = useState<'landing' | 'editor' | 'list' | 'settings'>('editor');

  // Détection URL signature client à distance (?sign=... ou ?quote=...)
  const [clientSignQuoteId, setClientSignQuoteId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('sign') || params.get('quote') || null;
    }
    return null;
  });
  const [isClientSignTesting, setIsClientSignTesting] = useState(false);

  // Modales
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isPDFOpen, setIsPDFOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!artisan.isOnboarded);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalDefaultTab, setLegalDefaultTab] = useState<'mentions' | 'privacy' | 'cgv'>('mentions');

  // Sauvegarde locale Offline-First
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ARTISAN, JSON.stringify(artisan));
    if (userId) {
      syncProfileToCloud(artisan, userId);
    }
  }, [artisan, userId]);

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
    if (userId) {
      syncQuoteToCloud(updatedQuote, userId);
    }
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

  // Création d'une Facture d'Avoir légale (CGI art. 289)
  const handleCreateCreditNote = (originalQuote: Quote, reason: string) => {
    const countAvoirs = quotes.filter((q) => q.docType === 'avoir').length;
    const creditNum = generateCreditNoteNumber(countAvoirs);
    const invoiceRef = originalQuote.invoiceNumber || originalQuote.number;

    const creditNote: Quote = {
      ...originalQuote,
      id: 'avoir-' + Date.now(),
      docType: 'avoir',
      number: creditNum,
      creditNoteNumber: creditNum,
      originalInvoiceNumber: invoiceRef,
      creditNoteReason: reason || 'Annulation / Rectification de facture suite à accord commercial',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      validUntil: new Date().toLocaleDateString('fr-FR'),
      status: 'avoir_emis',
    };

    setQuotes((prev) => [creditNote, ...prev]);
    setCurrentQuote(creditNote);
    setIsPDFOpen(true);
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

    // Vibration haptique mobile si disponible
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Notification SMS & Email automatique lors de la signature client
    if (artisan.sendSmsOnSign || artisan.sendEmailOnSign) {
      const recipient = artisan.notificationPhone || artisan.phone || '06 ** ** ** **';
      setActiveAlert({
        type: 'sms',
        title: '🔔 Signature Client Reçue & Validée !',
        message: `Alerte SMS transmise au ${recipient} : Devis ${currentQuote.number} signé par ${currentQuote.client.name || 'le client'} (${currentQuote.totalTTC.toFixed(2)} € TTC).`,
      });

      // Simulation webhook externe (Zapier / Make / API SMS)
      if (artisan.webhookUrl) {
        console.log(`[DevisMinute] Webhook transmis vers ${artisan.webhookUrl} pour le devis ${currentQuote.number}`);
      }

      setTimeout(() => {
        setActiveAlert(null);
      }, 7000);
    }
  };

  const handlePaymentSuccess = (quoteId: string) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: 'acompte_paye' } : q))
    );
    if (currentQuote.id === quoteId) {
      setCurrentQuote((prev) => ({ ...prev, status: 'acompte_paye' }));
    }
  };

  const handleConvertToInvoice = (type: 'acompte' | 'solde', targetQuote?: Quote) => {
    const quoteToConvert = targetQuote || currentQuote;
    const invoiceNum = generateInvoiceNumber(quotes.length, type);
    const updated: Quote = {
      ...quoteToConvert,
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

  // VUE AUTONOME CLIENT : Signature électronique à distance (Lien direct SMS / WhatsApp / Email)
  if (clientSignQuoteId || isClientSignTesting) {
    const signQuote =
      quotes.find((q) => q.id === (clientSignQuoteId || currentQuote.id)) || currentQuote;

    return (
      <ClientSignView
        quote={signQuote}
        artisan={artisan}
        onSignComplete={(signedQuote) => {
          handleUpdateCurrentQuote(signedQuote);
          if (artisan.sendSmsOnSign || artisan.sendEmailOnSign) {
            const recipient = artisan.notificationPhone || artisan.phone || '06 ** ** ** **';
            setActiveAlert({
              type: 'sms',
              title: '🔔 Devis Signé en Ligne par le Client !',
              message: `Alerte SMS transmise au ${recipient} : Devis ${signedQuote.number} validé et signé par ${signedQuote.client.name || 'le client'} (${signedQuote.totalTTC.toFixed(2)} € TTC).`,
            });
          }
        }}
        onBackToApp={() => {
          setClientSignQuoteId(null);
          setIsClientSignTesting(false);
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-100 text-slate-900 theme-light' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Navigation Top Bar Mobile-Optimized */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-200 ${
        theme === 'light' ? 'bg-white/95 border-slate-200 shadow-sm' : 'bg-slate-900/95 border-slate-800'
      }`}>
        <div className="max-w-4xl mx-auto px-2 sm:px-4 h-14 flex items-center justify-center">
          {/* Navigation Links Principaux (Harmonieux et équilibrés) */}
          <nav className="flex items-center justify-between sm:justify-center gap-1 sm:gap-2 w-full">
            <button
              onClick={() => setActiveView('landing')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition ${
                activeView === 'landing'
                  ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Présentation & Simulateur"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Offre</span>
            </button>

            <button
              onClick={() => setActiveView('editor')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition ${
                activeView === 'editor'
                  ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Devis</span>
            </button>

            <button
              onClick={() => setActiveView('list')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition ${
                activeView === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Chantiers</span>
            </button>

            <button
              onClick={() => setActiveView('settings')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition ${
                activeView === 'settings'
                  ? 'bg-amber-500 text-slate-950 shadow glow-amber'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Mon Entreprise"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Profil</span>
            </button>

            {/* Bouton Toggle Thème Chantier Plein Soleil / Nuit */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 ${
                theme === 'light'
                  ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
              }`}
              title={theme === 'dark' ? 'Passer en Mode Plein Soleil (Clair)' : 'Passer en Mode Sombre'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{theme === 'dark' ? 'Soleil' : 'Nuit'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition"
              title="Installer l'application sur smartphone"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Installer l'App</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Indicateur de Statut Réseau / Mode Hors-ligne */}
      <OfflineIndicator />

      {/* Toast Notification Alert (SMS / Email en direct) */}
      {activeAlert && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100%-2rem)] animate-bounce-short bg-slate-900 border-2 border-amber-500 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 backdrop-blur-xl">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shrink-0 mt-0.5 animate-pulse">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-black text-sm text-amber-400">{activeAlert.title}</h4>
              <button
                type="button"
                onClick={() => setActiveAlert(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">{activeAlert.message}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeView === 'landing' && (
          <LandingPage
            onStartFreeTrial={() => setActiveView('editor')}
            onOpenLegal={(tab) => {
              setLegalDefaultTab(tab);
              setShowLegalModal(true);
            }}
          />
        )}

        {activeView === 'editor' && (
          <QuickQuoteEditor
            quote={currentQuote}
            artisan={artisan}
            onUpdateQuote={handleUpdateCurrentQuote}
            onOpenSignature={() => setIsSignatureOpen(true)}
            onOpenPreview={() => setIsPDFOpen(true)}
            onOpenPayment={() => setIsPaymentOpen(true)}
            onOpenClientSign={() => setIsClientSignTesting(true)}
            onConvertToInvoice={(type) => handleConvertToInvoice(type)}
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
            onCreateCreditNote={handleCreateCreditNote}
            onOpenPDF={(q) => {
              setCurrentQuote(q);
              setIsPDFOpen(true);
            }}
            onOpenPayment={(q) => {
              setCurrentQuote(q);
              setIsPaymentOpen(true);
            }}
            onConvertToInvoice={(q, type) => handleConvertToInvoice(type, q)}
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

            {/* Pied de page Réglages : Accès rapide Conformité Légale & RGPD */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setLegalDefaultTab('mentions');
                  setShowLegalModal(true);
                }}
                className="hover:text-amber-400 transition"
              >
                Mentions Légales
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => {
                  setLegalDefaultTab('privacy');
                  setShowLegalModal(true);
                }}
                className="hover:text-amber-400 transition"
              >
                Confidentialité & RGPD
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => {
                  setLegalDefaultTab('cgv');
                  setShowLegalModal(true);
                }}
                className="hover:text-amber-400 transition"
              >
                Conditions Générales (CGV / CGU)
              </button>
            </div>
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
          onOpenClientSign={() => {
            setIsPDFOpen(false);
            setIsClientSignTesting(true);
          }}
          onConvertToInvoice={handleConvertToInvoice}
          onCreateCreditNote={handleCreateCreditNote}
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

      {/* Modale d'Installation PWA sur Smartphone */}
      <InstallPwaModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Modale Juridique & Conformité Réglementaire (LCEN, RGPD, CGV) */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalDefaultTab}
      />
    </div>
  );
}

export default App;
