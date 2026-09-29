import type { QuoteItem, VatRate } from '../types';

export type VoiceIntent =
  | { type: 'item'; item: Partial<QuoteItem> }
  | { type: 'discount'; discountType: 'percent' | 'fixed'; value: number }
  | { type: 'deposit'; percent: number }
  | { type: 'client'; name?: string; address?: string; phone?: string };

// Conversion des nombres écrits en lettres françaises vers chiffres
const FRENCH_NUMBER_WORDS: { [key: string]: number } = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  vingt: 20,
  trente: 30,
  quarante: 40,
  cinquante: 50,
  soixante: 60,
  cent: 100,
  mille: 1000,
};

export function normalizeFrenchNumbers(text: string): string {
  let normalized = text.toLowerCase();

  // Remplacements composés courants
  normalized = normalized.replace(/\bdeux cents?\b/g, '200');
  normalized = normalized.replace(/\btrois cents?\b/g, '300');
  normalized = normalized.replace(/\bquatre cents?\b/g, '400');
  normalized = normalized.replace(/\bcinq cents?\b/g, '500');
  normalized = normalized.replace(/\bsept cents?\b/g, '700');
  normalized = normalized.replace(/\bhuit cents?\b/g, '800');
  normalized = normalized.replace(/\bneuf cents?\b/g, '900');
  normalized = normalized.replace(/\bmille\b/g, '1000');
  normalized = normalized.replace(/\bdeux mille\b/g, '2000');
  normalized = normalized.replace(/\btrois mille\b/g, '3000');

  // Mots simples
  Object.entries(FRENCH_NUMBER_WORDS).forEach(([word, val]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, val.toString());
  });

  return normalized;
}

export function parseVoiceInputAdvanced(rawText: string): VoiceIntent | null {
  const text = rawText.trim();
  if (!text) return null;

  const normalized = normalizeFrenchNumbers(text);

  // =========================================================================
  // 1. INTENTION : REMISE COMMERCIALE / RABAIS / GESTE
  // Ex: "remise de 5%", "remise commerciale de 5 %", "rabais de 50 euros", "remise 10%"
  // =========================================================================
  const discountMatch = normalized.match(/(?:remise|rabais|r[ée]duction|geste(?:\s+commercial)?)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)\s*(%|pourcent|euros?|€)?/i);
  if (discountMatch) {
    const val = parseFloat(discountMatch[1].replace(',', '.'));
    const unit = discountMatch[2] ? discountMatch[2].toLowerCase() : '%';
    const isPercent = unit.includes('%') || unit.includes('pourcent');
    return {
      type: 'discount',
      discountType: isPercent ? 'percent' : 'fixed',
      value: val,
    };
  }

  // =========================================================================
  // 2. INTENTION : ACOMPTE
  // Ex: "acompte de 30%", "acompte 40 pourcent"
  // =========================================================================
  const depositMatch = normalized.match(/acompte\s*(?:de)?\s*(\d+)\s*(?:%|pourcent)/i);
  if (depositMatch) {
    const pct = parseInt(depositMatch[1], 10);
    return {
      type: 'deposit',
      percent: Math.min(100, Math.max(0, pct)),
    };
  }

  // =========================================================================
  // 3. INTENTION : CLIENT / DESTINATAIRE
  // Ex: "client monsieur dupont", "pour madame martin au 12 rue de la paix"
  // =========================================================================
  const clientMatch = text.match(/^(?:client|pour)\s+(monsieur|madame|m\.|mme)?\s*([^,\.]+)(?:,\s*(?:adresse|au)?\s*(.+))?/i);
  if (clientMatch) {
    const title = clientMatch[1] ? clientMatch[1] + ' ' : '';
    const name = (title + (clientMatch[2] || '')).trim();
    const address = clientMatch[3]?.trim();
    return {
      type: 'client',
      name,
      address,
    };
  }

  // =========================================================================
  // 4. INTENTION : LIGNE DE PRESTATION / FOURNITURE DEVIS
  // Ex: "pose de 2 unités de chauffage 450 euros", "3 prises étanches 120€",
  // "remplacement chauffe-eau 200l 680 euros"
  // =========================================================================

  // A. Détection du Prix
  let price = 0;
  const priceMatch = normalized.match(/(?:[àa]|pour|co[uû]t(?:e)?|\:)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?|euro|eur)\s*(?:ht|ttc)?/i);
  if (priceMatch && priceMatch[1]) {
    price = parseFloat(priceMatch[1].replace(',', '.'));
  }

  // B. Détection de l'Unité
  let detectedUnit: 'u' | 'm²' | 'ml' | 'h' | 'forfait' | 'j' = 'forfait';
  if (/unit[ée]s?|pi[èe]ces?|blocs?|appareils?|radiateurs?|prises?|vannes?|cumulus|chauffe-eau/i.test(normalized)) {
    detectedUnit = 'u';
  } else if (/m[èe]tres?\s*carr[ée]s?|m2|m²/i.test(normalized)) {
    detectedUnit = 'm²';
  } else if (/m[èe]tres?\s*lin[ée]aires?|ml\b/i.test(normalized)) {
    detectedUnit = 'ml';
  } else if (/heures?|\bh\b|main\s*d['’]oeuvre/i.test(normalized)) {
    detectedUnit = 'h';
  } else if (/jours?|journ[ée]es?/i.test(normalized)) {
    detectedUnit = 'j';
  }

  // C. Détection de la Quantité
  let quantity = 1;
  // Recherche d'un chiffre suivi d'une unité ou d'un nom d'article
  const qtyPattern = normalized.match(/(?:pose\s+de\s+|installation\s+de\s+|fourniture\s+de\s+|^)?(\d+)\s*(?:unit[ée]s?|pi[èe]ces?|m2|m²|ml|heures?|h|jours?|chauffe-eau|radiateurs?|prises?|portes?|fen[êe]tres?)/i);
  if (qtyPattern && qtyPattern[1]) {
    quantity = parseFloat(qtyPattern[1]);
  } else {
    // Si la phrase commence par un chiffre (ex: "2 chauffe-eau...")
    const startQty = normalized.match(/^(\d+)\s+/);
    if (startQty && startQty[1]) {
      quantity = parseFloat(startQty[1]);
    }
  }

  // D. Détection du Taux de TVA adapté BTP France
  let vatRate: VatRate = 10;
  if (/pompe\s*[àa]\s*chaleur|pac|isolation|r[ée]novation\s*[ée]nerg[ée]tique|solaire|5\.5/i.test(normalized)) {
    vatRate = 5.5;
  } else if (/neuf|agrandissement|construction|mat[ée]riel\s*seul|20%/i.test(normalized)) {
    vatRate = 20;
  }

  // E. Détection de la Pièce / Zone de chantier
  let detectedRoom: string | undefined = undefined;
  if (/dans\s+(?:la\s+)?cuisine|zone\s+cuisine/i.test(normalized)) {
    detectedRoom = 'Cuisine';
  } else if (/dans\s+(?:la\s+)?salle\s+de\s+bains?|sdb/i.test(normalized)) {
    detectedRoom = 'Salle de bain';
  } else if (/dans\s+(?:le\s+)?salon|s[ée]jour/i.test(normalized)) {
    detectedRoom = 'Salon / Séjour';
  } else if (/dans\s+(?:la\s+)?chambre/i.test(normalized)) {
    detectedRoom = 'Chambre';
  } else if (/(?:dans\s+(?:les?\s+)?)?wc|toilettes/i.test(normalized)) {
    detectedRoom = 'WC';
  } else if (/ext[ée]rieur|jardin|terrasse|fa[çc]ade/i.test(normalized)) {
    detectedRoom = 'Extérieur';
  } else if (/toiture|combles|charpente/i.test(normalized)) {
    detectedRoom = 'Toiture / Combles';
  } else if (/garage|cave|sous-sol/i.test(normalized)) {
    detectedRoom = 'Garage / Sous-sol';
  }

  // F. Nettoyage de la Désignation
  let cleanDesignation = text
    .replace(/(?:[àa]|pour|co[uû]t(?:e)?|\:)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?|euro|eur)\s*(?:ht|ttc)?/gi, '')
    .replace(/dans\s+(?:la\s+)?(?:cuisine|salle\s+de\s+bains?|sdb|salon|chambre|terrasse|toiture|cave|garage)/gi, '')
    .trim();

  // Supprimer les bruits de début de phrase
  cleanDesignation = cleanDesignation.replace(/^(ajoute|cr[ée]e|mets?|ins[èe]re)\s+/i, '');

  // Majuscule sur la première lettre
  if (cleanDesignation.length > 0) {
    cleanDesignation = cleanDesignation.charAt(0).toUpperCase() + cleanDesignation.slice(1);
  } else {
    cleanDesignation = "Prestation de travaux";
  }

  return {
    type: 'item',
    item: {
      designation: cleanDesignation,
      quantity: quantity > 0 ? quantity : 1,
      unit: detectedUnit,
      unitPriceHT: price > 0 ? price : 100,
      vatRate,
      room: detectedRoom,
      category: detectedUnit === 'h' ? 'main_d_oeuvre' : detectedUnit === 'u' ? 'fourniture' : 'forfait',
    },
  };
}
