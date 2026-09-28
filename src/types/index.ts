export type VatRate = 0 | 5.5 | 10 | 20;

export interface QuoteItem {
  id: string;
  designation: string;
  category: 'main_d_oeuvre' | 'fourniture' | 'forfait' | 'deplacement';
  quantity: number;
  unit: 'u' | 'm²' | 'ml' | 'h' | 'forfait' | 'j';
  unitPriceHT: number;
  costPriceHT?: number; // Prix de revient/achat pour calcul de marge discrète
  vatRate: VatRate;
  totalHT: number;
}

export interface ClientInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  isSiteAddressDifferent?: boolean;
  siteAddress?: string;
  sitePostalCode?: string;
  siteCity?: string;
  siteAccessNotes?: string;
}

export interface QuotePhoto {
  id: string;
  dataUrl: string;
  caption: string;
  type: 'avant' | 'apres' | 'constat';
  includeInPdf: boolean;
  createdAt: string;
}

export interface ArtisanProfile {
  companyName: string;
  artisanName: string;
  trade: string;
  siret: string;
  rcsOrRma: string;
  tvaIntra: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  decennaleCompany: string;
  decennalePoliceNumber: string;
  decennaleCoverageArea: string;
  ribIban: string;
  ribBic: string;
  defaultHourlyRate: number; // Taux horaire par défaut
  isOnboarded?: boolean;
  logoUrl?: string;
}

export type QuoteStatus = 'brouillon' | 'envoye' | 'signe' | 'acompte_paye' | 'facture_acompte' | 'facture_solde';

export type DocumentType = 'devis' | 'facture_acompte' | 'facture_solde';

export interface Quote {
  id: string;
  number: string;
  docType?: DocumentType;
  invoiceNumber?: string;
  createdAt: string;
  validUntil: string;
  status: QuoteStatus;
  client: ClientInfo;
  items: QuoteItem[];
  photos?: QuotePhoto[];
  // Remise commerciale
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountAmountHT: number;
  // Acompte
  depositPercent: number; // Ex: 30%
  depositAmountTTC: number;
  // Signature & Paiement
  signatureDataUrl?: string;
  signedAt?: string;
  paymentLink?: string;
  notes?: string;
  // Totaux calculés
  totalBrutHT: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  estimatedMarginHT?: number; // Marge brute estimée
  vatBreakdown: { [key in VatRate]?: { baseHT: number; vatAmount: number } };
}

export interface PresetCatalogItem {
  id: string;
  trade: 'plomberie' | 'electricite' | 'serrurerie' | 'peinture' | 'climatisation' | 'general' | 'menuiserie';
  label: string;
  category: 'main_d_oeuvre' | 'fourniture' | 'forfait' | 'deplacement';
  defaultPriceHT: number;
  defaultUnit: 'u' | 'm²' | 'ml' | 'h' | 'forfait' | 'j';
  defaultVatRate: VatRate;
  costEstimateHT?: number;
}
