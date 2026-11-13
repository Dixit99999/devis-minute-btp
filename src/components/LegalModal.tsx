import React, { useState } from 'react';
import { X, Scale, Shield, FileText, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'mentions' | 'privacy' | 'cgv';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'mentions',
}) => {
  const [activeTab, setActiveTab] = useState<'mentions' | 'privacy' | 'cgv'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Informations Juridiques & Conformité</h3>
              <p className="text-xs text-slate-400">Devis Minute BTP • Conforme LCEN, RGPD (DPA), eIDAS & Code de commerce</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation par Onglets */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('mentions')}
            className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'mentions'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Mentions Légales
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Confidentialité & RGPD (DPA)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cgv')}
            className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'cgv'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Conditions Générales (CGV / CGU)
          </button>
        </div>

        {/* Corps Scrollable du Texte */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar text-xs text-slate-300 space-y-5 leading-relaxed bg-slate-900">
          {activeTab === 'mentions' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-2.5 text-amber-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mentions obligatoires établies conformément à la loi n° 2004-575 du 21 juin 2004 (LCEN).</span>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                  1. Éditeur de l'Application SaaS
                </h4>
                <p>
                  L'application web et mobile <strong>Devis Minute BTP</strong> (accessible via <em>https://devis-minute-btp.vercel.app</em>) est éditée par :
                </p>
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                  <p><strong className="text-slate-200">Éditeur :</strong> Devis Minute BTP</p>
                  <p><strong className="text-slate-200">Activité :</strong> Édition de logiciels applicatifs & solutions SaaS pour les professionnels du BTP (Code APE 6201Z / 5829C)</p>
                  <p><strong className="text-slate-200">Localisation :</strong> France (Rodez / Occitanie)</p>
                  <p><strong className="text-slate-200">Contact Email :</strong> <a href="mailto:contact@devis-minute-btp.fr" className="text-amber-400 font-bold underline">contact@devis-minute-btp.fr</a></p>
                  <p><strong className="text-slate-200">Directeur de la Publication :</strong> Responsable de la publication Devis Minute BTP</p>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">2. Hébergement de l'Application & Base de Données</h4>
                <p>L'infrastructure d'hébergement, le déploiement continu et le stockage sécurisé des données sont assurés par :</p>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                  <div>
                    <p><strong className="text-slate-200">Hébergeur Applicatif (Frontend & Edge) :</strong> Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA — https://vercel.com)</p>
                  </div>
                  <div className="pt-1 border-t border-slate-800">
                    <p><strong className="text-slate-200">Hébergeur Base de Données (Cloud EU) :</strong> Supabase / AWS Europe (Serveurs situés dans l'Union Européenne — Francfort/Paris, chiffrement AES-256 et TLS)</p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">3. Propriété Intellectuelle</h4>
                <p>
                  L'ensemble des marques, graphismes, interfaces, algorithmes de dictée vocale sémantique et éléments logiciels composant l'application Devis Minute BTP sont la propriété exclusive de leur éditeur. L'abonnement ne confère au Client qu'un droit d'usage personnel, non exclusif et non cessible. Toute reproduction, décompilation ou extraction automatisée (scraping) est strictement prohibée.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center gap-2.5 text-emerald-300">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Politique conforme au RGPD (UE 2016/679), à la loi Informatique et Libertés et incluant l'Accord de Traitement des Données (DPA Art. 28).</span>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">1. Rôle des Parties (Responsable de Traitement & Sous-traitant)</h4>
                <p>
                  Conformément à l'article 28 du RGPD :
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>L'Artisan (Client) agit en qualité de Responsable de Traitement</strong> pour les données personnelles de ses propres clients finaux (noms, adresses de chantier, coordonnées, signatures).</li>
                  <li><strong>Devis Minute BTP (Éditeur) agit en qualité de Sous-traitant technique</strong> pour les données métier de l'Artisan, et de Responsable de Traitement uniquement pour la gestion du compte et de l'abonnement de l'Artisan.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">2. Données Collectées, Finalités & Sous-traitants Ultérieurs</h4>
                <p>Nous traitons uniquement les données strictement nécessaires à la fourniture du service SaaS, avec l'appui des sous-traitants certifiés suivants :</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Supabase / AWS (Union Européenne) :</strong> Hébergement chiffré de la base de données (profils, devis, factures) avec isolation stricte Row Level Security (RLS).</li>
                  <li><strong>Stripe Payments Europe :</strong> Gestion des abonnements et paiements sécurisés certifiés PCI-DSS Niveau 1. Aucune donnée bancaire complète n'est stockée sur nos serveurs.</li>
                  <li><strong>Vercel Inc. :</strong> Distribution applicative web/PWA sécurisée (clauses contractuelles types SCC).</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">3. Confidentialité, IA & Propriété des Données Métier</h4>
                <p className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-slate-200">
                  🔒 <strong>Garantie Anti-Partage & Sécurité IA :</strong> Vos fichiers clients, catalogues et devis vous appartiennent à 100%. Ils ne sont ni vendus, ni loués, ni utilisés pour entraîner des modèles d'intelligence artificielle publics.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">4. Durées de Conservation, Réversibilité & Notification</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Comptes actifs :</strong> Données conservées pendant toute la durée du contrat.</li>
                  <li><strong>Essai non converti ou Résiliation (Réversibilité) :</strong> À l'issue de l'abonnement ou de l'essai, le Client dispose d'un délai de <strong>30 jours</strong> pour exporter ses documents (PDF, CSV, FEC) avant suppression définitive.</li>
                  <li><strong>Obligation légale comptable :</strong> Les pièces de facturation sont soumises à l'obligation légale d'archivage de 10 ans (Art. L.123-22 Code de commerce et L.102 B du LPF).</li>
                  <li><strong>Notification de violation :</strong> En cas d'incident de sécurité affectant des données à caractère personnel, l'Éditeur notifiera le Client dans un délai maximal de 48 heures.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">5. Exercice de vos Droits & CNIL</h4>
                <p>
                  Conformément aux articles 15 à 22 du RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et de portabilité. Contact DPO : <a href="mailto:privacy@devis-minute-btp.fr" className="text-amber-400 font-bold underline">privacy@devis-minute-btp.fr</a> (réponse sous 30 jours). Réclamation possible auprès de la CNIL (<em>www.cnil.fr</em>).
                </p>
              </section>
            </div>
          )}

          {activeTab === 'cgv' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 p-3.5 rounded-2xl flex items-center gap-2.5 text-blue-300 font-semibold">
                <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Conditions Générales de Vente et d'Utilisation (CGV/CGU) — Version en vigueur au 1er novembre 2026.</span>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">Article 1. Restriction B2B & Exclusion du Droit de la Consommation</h4>
                <p>
                  Le Service <strong>Devis Minute BTP</strong> s'adresse exclusivement aux professionnels agissant dans le cadre de leur activité artisanale, commerciale, industrielle ou libérale (Artisans, TPE/PME du bâtiment, Auto-entrepreneurs). Le Client reconnaît ne pas avoir la qualité de consommateur ni de non-professionnel au sens du Code de la consommation. En conséquence, le droit de rétractation légal de 14 jours prévu pour les consommateurs ne s'applique pas aux présentes (sans préjudice de la période d'essai gratuite commerciale offerte à l'inscription).
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">Article 2. Qualification du Logiciel & Exclusion Caisse NF525</h4>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
                  <p className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Clause essentielle — Logiciel de Gestion Commerciale et de Facturation :</span>
                  </p>
                  <p>
                    Devis Minute BTP est un outil d'aide au chiffrage, à l'émission de devis/factures et au suivi de chantier. <strong>Il ne constitue ni un logiciel de comptabilité, ni un système de caisse enregistreuse</strong> au sens du 3° bis du I de l'article 286 du Code Général des Impôts (certification NF525).
                  </p>
                  <p>
                    Les mentions « Acompte payé » ou « Réglé » constituent de simples indicateurs visuels de classement commercial sans valeur d'enregistrement de caisse. Si le Client est assujetti à la TVA et réalise des encaissements auprès de particuliers entrant dans le champ de la loi anti-fraude TVA, il lui appartient d'utiliser un terminal ou système d'encaissement certifié indépendant (tel que Stripe ou son établissement bancaire).
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">Article 3. Responsabilité du Client & Fonctionnalités de Dictée Vocale / IA</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Exactitude métier & fiscale :</strong> Le Client demeure seul et unique responsable de l'exactitude des données saisies : coordonnées, SIRET, assurances décennales obligatoires (Loi Pinel), prix unitaires, ainsi que du choix des taux de TVA applicables (5,5%, 10%, 20% ou franchise en base art. 293 B du CGI).</li>
                  <li><strong>Vérification de la Dictée Vocale & IA :</strong> Les lignes de chiffrage générées par la reconnaissance vocale sémantique ou l'assistance IA sont fournies à titre purement indicatif pour accélérer la saisie. <strong>Le Client s'engage à relire et vérifier systématiquement chaque devis ou facture avant transmission ou signature.</strong> L'Éditeur décline toute responsabilité en cas d'erreur de transcription vocale, de litige commercial ou de redressement fiscal.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">Article 4. Signature Électronique (eIDAS) & Facturation Électronique (Factur-X)</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Signature Électronique Simple (SES) :</strong> Le module de signature tactile sur écran ou à distance constitue une signature électronique de niveau « Simple » au sens du Règlement européen eIDAS et de l'article 1367 du Code civil, avec horodatage et empreinte graphique. Il appartient au Client de recueillir le consentement éclairé de son client final.</li>
                  <li><strong>Factur-X & Export FEC :</strong> Le Logiciel permet la génération de documents compatibles avec la norme européenne EN 16931 (Factur-X) et l'export d'écritures au format FEC (art. A.47 A-1 du LPF). L'Éditeur agit comme éditeur de solution technique et non en tant que Plateforme Agréée (ex-PDP) immatriculée par la DGFiP.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">Article 5. Tarifs, Paiement Stripe, Retard & Résiliation en 1 Clic</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Formules :</strong> Forfait Mensuel à 59 € HT/mois ou Forfait Annuel à 564 € HT/an (équivalent à 47 € HT/mois), précédés d'une période d'essai gratuit de 14 jours.</li>
                  <li><strong>Reconduction & Résiliation :</strong> Abonnement renouvelable par tacite reconduction, résiliable à tout moment sans préavis ni frais depuis l'espace client Stripe ou par simple demande écrite. La résiliation prend effet à l'échéance de la période en cours (tout mois ou année entamé restant dû).</li>
                  <li><strong>Retard de paiement (Art. L.441-10 Code de commerce) :</strong> Tout rejet ou retard de paiement entraîne de plein droit des pénalités égales à 3 fois le taux d'intérêt légal ainsi qu'une indemnité forfaitaire pour frais de recouvrement de <strong>40 €</strong>, et la suspension de l'accès après préavis de 7 jours.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">Article 6. Niveau de Service (SLA), Fair Use & Plafond de Responsabilité</h4>
                <p>
                  L'Éditeur est tenu à une obligation de moyens (objectif de disponibilité de 99% hors maintenance). Pour garantir la stabilité du service, un usage loyal (Fair Use) est fixé à 500 documents générés par mois et 5 Go de stockage photos par compte.
                </p>
                <p className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-200 font-semibold">
                  ⚖️ <strong>Plafond d'indemnisation :</strong> En toute hypothèse, si la responsabilité de l'Éditeur devait être engagée, le montant total et cumulé des indemnisations toutes causes confondues est expressément plafonné au montant des sommes effectivement payées par le Client au cours des <strong>douze (12) derniers mois</strong> précédant le fait générateur.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">Article 7. Droit Applicable, Médiation & Juridiction Compétente</h4>
                <p>
                  Les présentes CGV/CGU sont régies par le droit français. En cas de différend, les parties s'engagent à rechercher une solution amiable dans un délai de 30 jours. À défaut d'accord amiable, compétence expresse et exclusive est attribuée au <strong>Tribunal de Commerce du ressort du siège social de l'Éditeur</strong>, nonobstant pluralité de défendeurs ou appel en garantie.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer avec Bouton Fermer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Version 2.0 • Mise à jour réglementaire : Novembre 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
