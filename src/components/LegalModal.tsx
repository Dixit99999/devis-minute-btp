import React, { useState } from 'react';
import { X, Scale, Shield, FileText, Lock, CheckCircle2 } from 'lucide-react';

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
              <p className="text-xs text-slate-400">Devis Minute BTP • Conforme LCEN, RGPD (CNIL) & Code de commerce</p>
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
            Confidentialité & RGPD
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
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar text-xs text-slate-300 space-y-5 leading-relaxed bg-slate-950/40">
          {activeTab === 'mentions' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-center gap-2.5 text-amber-300">
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
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                  <p><strong className="text-slate-200">Éditeur :</strong> Devis Minute BTP</p>
                  <p><strong className="text-slate-200">Activité :</strong> Édition de logiciels applicatifs & solutions SaaS pour les professionnels du BTP (Code NAF 6201Z)</p>
                  <p><strong className="text-slate-200">Localisation :</strong> France (Rodez / Occitanie)</p>
                  <p><strong className="text-slate-200">Contact Email :</strong> contact@devis-minute-btp.fr</p>
                  <p><strong className="text-slate-200">Directeur de la Publication :</strong> Responsable de la publication Devis Minute BTP</p>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">2. Hébergement de l'Application</h4>
                <p>L'infrastructure d'hébergement, le déploiement continu et la distribution globale de l'application sont assurés par :</p>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                  <p><strong className="text-slate-200">Hébergeur :</strong> Vercel Inc.</p>
                  <p><strong className="text-slate-200">Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
                  <p><strong className="text-slate-200">Site Web :</strong> https://vercel.com</p>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">3. Propriété Intellectuelle</h4>
                <p>
                  L'ensemble des marques, graphismes, interfaces, algorithmes de dictée vocale sémantique et éléments logiciels composant l'application Devis Minute BTP sont la propriété exclusive de leur éditeur. Toute reproduction totale ou partielle sans autorisation expresse est prohibée.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center gap-2.5 text-emerald-300">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Politique conforme au Règlement Général sur la Protection des Données (RGPD 2016/679) et aux normes CNIL.</span>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">1. Données Collectées & Finalités</h4>
                <p>Nous collectons et traitons uniquement les données strictement nécessaires à l'exécution du service :</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Données de compte & facturation :</strong> Email, raison sociale, SIRET, coordonnées de l'artisan (nécessaires pour l'exécution du contrat et la facturation de l'abonnement).</li>
                  <li><strong>Données de devis & chantiers :</strong> Noms des clients, adresses de chantiers, montants, signatures tactiles et photos (strictement réservées à l'artisan pour la production de ses documents).</li>
                  <li><strong>Paiement sécurisé :</strong> Les coordonnées bancaires et cartes sont traitées directement par notre prestataire certifié PCI-DSS <strong>Stripe</strong>. Aucun numéro de carte bancaire ne transite ni n'est stocké sur nos serveurs.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">2. Confidentialité & Propriété des Données Métier</h4>
                <p className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-slate-200">
                  🔒 <strong>Garantie Anti-Partage :</strong> Vos données clients et vos chantiers vous appartiennent à 100%. Elles ne sont ni revendues, ni louées, ni partagées avec des régies publicitaires ou des tiers.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">3. Durées de Conservation</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Comptes actifs :</strong> Données conservées pendant toute la durée de l'abonnement.</li>
                  <li><strong>Factures d'abonnement :</strong> 10 ans (obligation légale comptable, Code de commerce art. L.123-22).</li>
                  <li><strong>Mode Hors-ligne / Local :</strong> Les brouillons et catalogues sont stockés localement sur votre appareil (chiffrement navigateur).</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">4. Vos Droits & DPO (CNIL)</h4>
                <p>
                  Conformément aux articles 15 à 22 du RGPD, vous disposez d'un droit d'accès, de rectification, de suppression (*droit à l'oubli*), de limitation et de portabilité de vos données.
                </p>
                <p>
                  Pour exercer ces droits, contactez notre délégué à la protection des données à : <strong className="text-amber-400">privacy@devis-minute-btp.fr</strong> (réponse garantie sous 30 jours). Vous pouvez également déposer une réclamation auprès de la CNIL sur <em>www.cnil.fr</em>.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'cgv' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-2xl flex items-center gap-2.5 text-blue-300">
                <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Conditions régissant l'abonnement SaaS B2B Devis Minute BTP pour les professionnels.</span>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">1. Formules & Tarifs</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Abonnement Mensuel :</strong> 59 € HT / mois (prélèvement automatique mensuel).</li>
                  <li><strong>Abonnement Annuel :</strong> 564 € HT / an (paiement en une fois, équivalent à 47 € HT/mois • 2 mois offerts).</li>
                  <li><strong>Période d'Essai :</strong> 14 jours d'essai 100% gratuits, sans engagement de durée.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">2. Reconduction & Résiliation en 1 Clic</h4>
                <p>
                  L'abonnement est sans engagement de durée minimale (pour l'offre mensuelle) et se renouvelle tacitement à chaque échéance. L'artisan peut résilier son abonnement à tout moment en 1 clic depuis son portail client Stripe ou son profil. La résiliation prend effet à la fin de la période de facturation en cours sans pénalité.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">3. Disponibilité & Responsabilité</h4>
                <p>
                  Devis Minute BTP s'engage à assurer une disponibilité du service de 99% hors périodes de maintenance programmée. L'artisan demeure seul responsable de l'exactitude des prix, descriptions et taux de TVA appliqués sur les devis émis à ses propres clients.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white">4. Droit Applicable & Litiges</h4>
                <p>
                  Les présentes CGV sont soumises au droit français. En cas de contestation entre professionnels et à défaut de résolution amiable, compétence expresse est attribuée au Tribunal de Commerce du ressort du siège de l'éditeur.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer avec Bouton Fermer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Dernière mise à jour réglementaire : Septembre 2026
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
