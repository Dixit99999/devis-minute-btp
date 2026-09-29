import React, { useState } from 'react';
import { formatEuro } from '../utils/calculator';
import {
  Mic,
  PenTool,
  CreditCard,
  WifiOff,
  Clock,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Star,
  ChevronRight,
  Flame,
  Lock,
  Wrench,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LandingPageProps {
  onStartFreeTrial: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFreeTrial }) => {
  // Simulateur de ROI
  const [quotesPerMonth, setQuotesPerMonth] = useState<number>(15);
  const [minutesPerQuote, setMinutesPerQuote] = useState<number>(45);
  const [hourlyRate, setHourlyRate] = useState<number>(60);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Calculs du simulateur
  // Temps économisé : on passe de 45 min le soir à 2 min sur place -> ~40 min économisées par devis
  const hoursSavedPerMonth = Math.round((quotesPerMonth * (minutesPerQuote - 3)) / 60);
  const moneyValueSavedPerMonth = hoursSavedPerMonth * hourlyRate;

  const handleCtaClick = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onStartFreeTrial();
  };

  return (
    <div className="w-full space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 pt-4 sm:pt-8 max-w-3xl mx-auto animate-in fade-in duration-500">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>L'application n°1 des artisans & dépanneurs du BTP</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Le devis signé et l'acompte encaissé <br />
          <span className="text-gradient-amber">avant même de ranger vos outils.</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Fini les soirées passées sur l'ordinateur à taper des devis qui restent sans réponse. 
          Chiffrez à la voix en 30 secondes, faites signer sur votre smartphone et encaissez 30% d'acompte par CB sur place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl glow-amber transition flex items-center justify-center gap-2 group"
          >
            <span>Créer mon premier devis en 30s</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>

          <a
            href="#simulateur"
            className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Simuler mon gain de temps</span>
          </a>
        </div>

        {/* Reassurance Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-3">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 14 jours d'essai gratuit
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sans carte bancaire requise
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Fonctionne 100% hors-ligne
          </span>
        </div>
      </section>

      {/* 2. STATS & IMPACT IMMÉDIAT */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
        <div className="glass-card p-4 rounded-2xl text-center border border-slate-800">
          <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400">30 sec</div>
          <p className="text-[11px] text-slate-400 mt-1">Pour générer un devis complet</p>
        </div>
        <div className="glass-card p-4 rounded-2xl text-center border border-slate-800">
          <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">+85%</div>
          <p className="text-[11px] text-slate-400 mt-1">De devis signés sur place</p>
        </div>
        <div className="glass-card p-4 rounded-2xl text-center border border-slate-800">
          <div className="text-2xl sm:text-3xl font-mono font-black text-sky-400">18 h</div>
          <p className="text-[11px] text-slate-400 mt-1">De soirées gagnées / mois</p>
        </div>
        <div className="glass-card p-4 rounded-2xl text-center border border-slate-800">
          <div className="text-2xl sm:text-3xl font-mono font-black text-indigo-400">0 €</div>
          <p className="text-[11px] text-slate-400 mt-1">D'impayés grâce aux acomptes CB</p>
        </div>
      </section>

      {/* 3. SIMULATEUR DE GAIN DE TEMPS & ROI */}
      <section id="simulateur" className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/20 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Simulateur Interactif</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Combien d'heures et d'argent perdez-vous chaque mois ?
          </h2>
          <p className="text-xs text-slate-400">
            Ajustez vos paramètres réels pour mesurer l'impact de Devis Minute BTP sur votre activité :
          </p>
        </div>

        {/* Sliders */}
        <div className="space-y-4 pt-2">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-200 mb-1.5">
              <span>Nombre de devis réalisés par mois :</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{quotesPerMonth} devis</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={quotesPerMonth}
              onChange={(e) => setQuotesPerMonth(parseInt(e.target.value))}
              className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-200 mb-1.5">
              <span>Temps passé actuellement par devis (le soir sur PC) :</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{minutesPerQuote} minutes</span>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={minutesPerQuote}
              onChange={(e) => setMinutesPerQuote(parseInt(e.target.value))}
              className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-200 mb-1.5">
              <span>Votre taux horaire moyen :</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{hourlyRate} € / heure</span>
            </div>
            <input
              type="range"
              min="40"
              max="120"
              step="5"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseInt(e.target.value))}
              className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Résultat Calculé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Temps récupéré pour votre vie privée</span>
            <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
              ~{hoursSavedPerMonth} heures / mois
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Soit plus de 2 journées complètes de repos</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 p-4 rounded-2xl border border-amber-500/30 text-center">
            <span className="text-[10px] font-bold text-amber-300 uppercase">Valeur financière économisée</span>
            <div className="text-2xl font-mono font-black text-amber-400 mt-1">
              {formatEuro(moneyValueSavedPerMonth)} / mois
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Rentabilisé 20x dès le 1er mois d'utilisation</p>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg glow-amber transition flex items-center justify-center gap-2"
          >
            <span>Récupérer mes {hoursSavedPerMonth}h de soirées dès aujourd'hui</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4. LES 5 ARBITRAGES QUI FONT LA DIFFÉRENCE SUR LE TERRAIN */}
      <section className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">
            Conçu pour le smartphone, pas pour un bureau climatisé.
          </h2>
          <p className="text-xs text-slate-400">
            Toutes les fonctionnalités ont été pensées pour un usage à une main, avec des gants ou dans une cave obscure :
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Dictée Vocale IA Intelligente</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dites simplement : <em>« Pose de 2 chauffages 450€ remise 5% »</em>. L'IA convertit les nombres, isole la remise et rédige les lignes automatiquement.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <PenTool className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Signature Tactile sur Écran</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Faites signer le client au doigt sur votre téléphone. Le devis est verrouillé légalement avec date, heure et mentions obligatoires.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Acompte CB & Apple Pay sur Place</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Affichez le QR Code de paiement : le client scanne et règle 30% d'acompte instantanément. Zéro risque d'impayé ou de désistement.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">100% Fonctionnel Hors-Ligne</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dans un sous-sol ou une zone blanche sans 4G ? L'application fonctionne sans interruption grâce au mode PWA et synchronise dès le retour du réseau.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Catalogue 1-Clic Modifiable</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Personnalisez tous vos ouvrages habituels (chauffe-eau, dépannage, tableaux). Un toucher de pouce suffit pour insérer vos forfaits.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Facture d'Acompte & Solde en 1 Clic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dès l'acompte validé ou le chantier terminé, convertissez le devis en facture d'acompte ou de solde sans aucune ressaisie manuelle.
            </p>
          </div>
        </div>
      </section>

      {/* 5. TÉMOIGNAGES ARTISANS */}
      <section className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Ils ne passent plus leurs soirées à chiffrer
          </h2>
          <p className="text-xs text-slate-400">Retours d'expérience d'artisans sur le terrain :</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-slate-300 italic">
              « Avant, je rentrais à 19h30 et je passais 2h sur l'ordinateur. Maintenant, le client signe sur mon téléphone avant que je remonte dans ma camionnette. »
            </p>
            <div className="pt-1 border-t border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Thomas D.</p>
                <p className="text-[10px] text-slate-400">Plombier Chauffagiste (Nantes)</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-slate-300 italic">
              « Le QR code d'acompte est une révolution. Le client scanne avec son iPhone, paye en Apple Pay et je reçois la notification. Plus aucun impayé. »
            </p>
            <div className="pt-1 border-t border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Karim B.</p>
                <p className="text-[10px] text-slate-400">Serrurier & Dépannage (Lyon)</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-slate-300 italic">
              « La dictée vocale avec la remise automatique fonctionne parfaitement même avec le bruit de la circulation. L'app s'est payée toute seule. »
            </p>
            <div className="pt-1 border-t border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Julien M.</p>
                <p className="text-[10px] text-slate-400">Électricien Général (Bordeaux)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TARIFICATION TRANSPARENTE */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 max-w-lg mx-auto text-center space-y-5">
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Offre Artisan Pro</span>
          <h2 className="text-2xl font-black text-white">Un tarif unique, clair et sans engagement</h2>
        </div>

        {/* Toggle Mensuel / Annuel */}
        <div className="flex justify-center pt-1">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                billingPeriod === 'monthly' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('yearly')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
                billingPeriod === 'yearly' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annuel <span className="text-[10px] bg-emerald-500 text-slate-950 px-1 rounded font-black">-20%</span>
            </button>
          </div>
        </div>

        <div className="py-2">
          {billingPeriod === 'monthly' ? (
            <div>
              <div className="text-4xl font-mono font-black text-white">
                59 € <span className="text-sm font-sans font-normal text-slate-400">/ mois HT</span>
              </div>
              <p className="text-xs text-emerald-400 font-bold mt-1">14 jours d'essai 100% gratuit • Annulable en 1 clic</p>
            </div>
          ) : (
            <div>
              <div className="text-4xl font-mono font-black text-amber-400">
                564 € <span className="text-sm font-sans font-normal text-slate-300">/ an HT</span>
              </div>
              <div className="text-xs text-emerald-400 font-bold mt-1">
                (soit 47 € / mois • 2 mois offerts)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Facturation annuelle unique • 14 jours d'essai offerts</p>
            </div>
          )}
        </div>

        <ul className="space-y-2 text-xs text-slate-300 text-left max-w-xs mx-auto">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Devis & Factures illimités</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Dictée vocale IA sans restriction</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Signature tactile & Envoi WhatsApp/SMS</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encaissement CB & QR Code Stripe</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Mode Chantier Hors-ligne permanent</span>
          </li>
        </ul>

        <button
          type="button"
          onClick={handleCtaClick}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl glow-amber transition flex items-center justify-center gap-2"
        >
          <span>
            {billingPeriod === 'yearly'
              ? "Démarrer mes 14 jours d'essai (564€/an)"
              : "Démarrer mes 14 jours d'essai (59€/mois)"}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-slate-500">
          Sans engagement. Déductible de vos charges d'entreprise (Frais professionnels).
        </p>
      </section>
    </div>
  );
};
