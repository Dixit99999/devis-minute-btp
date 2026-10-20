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

export const ROOMS_DEFINITIONS: Array<{ name: string; regex: RegExp }> = [
  { name: 'Cuisine', regex: /\b(?:cuisine)\b/i },
  { name: 'Salle de bain', regex: /\b(?:salle\s+de\s+bains?|sdb|salle\s+d['’]eau|douche)\b/i },
  { name: 'Salon / Séjour', regex: /\b(?:salon|s[ée]jour|salle\s+[àa]\s+manger)\b/i },
  { name: 'Chambre', regex: /\b(?:chambre\s*\d*|suite\s+parentale)\b/i },
  { name: 'WC', regex: /\b(?:wc|toilettes|cabinet)\b/i },
  { name: 'Extérieur', regex: /\b(?:ext[ée]rieur|jardin|terrasse|balcon|fa[çc]ade)\b/i },
  { name: 'Toiture / Combles', regex: /\b(?:toiture|toit|combles|grenier|charpente)\b/i },
  { name: 'Garage / Sous-sol', regex: /\b(?:garage|cave|sous-sol|cellier|buanderie)\b/i },
  { name: 'Couloir / Entrée', regex: /\b(?:couloir|entr[ée]e|d[ée]gagement)\b/i },
];

/**
 * Fusionne deux fragments vocaux successifs en évitant les répétitions
 * causées par le chevauchement (overlap) de la Web Speech API sur Android Chrome.
 */
export function mergeOverlappingTranscripts(existing: string, incoming: string): string {
  const ex = existing.trim();
  const inc = incoming.trim();
  if (!ex) return inc;
  if (!inc) return ex;
  if (ex.toLowerCase().includes(inc.toLowerCase())) return ex;
  if (inc.toLowerCase().includes(ex.toLowerCase())) return inc;

  const maxOverlap = Math.min(ex.length, inc.length);
  for (let len = maxOverlap; len >= 3; len--) {
    const suffix = ex.slice(-len).toLowerCase();
    const prefix = inc.slice(0, len).toLowerCase();
    if (suffix === prefix) {
      return ex + inc.slice(len);
    }
  }
  return ex + ' ' + inc;
}

/**
 * Nettoyage des bégaiements générés par la Web Speech API sur certains navigateurs mobiles (ex: Android Chrome)
 * qui répètent des groupes de mots en boucle.
 */
export function deduplicateRepeatedPhrases(text: string): string {
  let clean = text.trim();
  // Nettoie les répétitions de phrases / groupes de mots (de 6 mots à 1 mot répétés consécutivement)
  for (let n = 6; n >= 1; n--) {
    const pattern = new RegExp(`(\\b(?:[a-zA-ZÀ-ÿ0-9€%'-]+\\s+){${n - 1}}[a-zA-ZÀ-ÿ0-9€%'-]+)(?:\\s+\\1)+`, 'gi');
    clean = clean.replace(pattern, '$1');
  }
  return clean;
}

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

export function parseVoiceInputAdvanced(
  rawText: string,
  defaultHourlyRate = 65,
  defaultTravelFee = 50
): VoiceIntent | null {
  const text = rawText.trim();
  if (!text) return null;

  const normalized = normalizeFrenchNumbers(text);

  // =========================================================================
  // 1. INTENTION : REMISE COMMERCIALE / RABAIS / GESTE
  // Ex: "remise de 5%", "rabais 50 euros", "remise 5%"
  // =========================================================================
  const discountMatch = normalized.match(/(?:remise|rabais|r[ée]duction|geste(?:\s+commercial)?)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)\s*(%|pourcent|euros?|€)?/i);
  if (discountMatch) {
    const val = parseFloat(discountMatch[1].replace(',', '.'));
    const unit = discountMatch[2] ? discountMatch[2].toLowerCase() : '%';
    const isPercent = !discountMatch[2] || unit.includes('%') || unit.includes('pourcent');
    return {
      type: 'discount',
      discountType: isPercent ? 'percent' : 'fixed',
      value: val,
    };
  }

  // =========================================================================
  // 2. INTENTION : ACOMPTE
  // Ex: "acompte de 30%", "acompte 30%"
  // =========================================================================
  const depositMatch = normalized.match(/acompte\s*(?:de)?\s*(\d+)\s*(?:%|pourcent)?/i);
  if (depositMatch) {
    const pct = parseInt(depositMatch[1], 10);
    return {
      type: 'deposit',
      percent: Math.min(100, Math.max(0, pct)),
    };
  }

  // =========================================================================
  // 3. INTENTION : CLIENT / DESTINATAIRE
  // Ex: "client monsieur dupont", "pour madame martin, 12 rue de la paix"
  // =========================================================================
  const clientMatch = text.match(/^(?:client|pour)\s+(?:monsieur|madame|m\.|mme)?\s*([^,\.]+)(?:[,\s]+(?:adresse|au)?\s*(.+))?/i);
  if (clientMatch && !/^(?:pose|fourniture|d[ée]placement)/i.test(clientMatch[1])) {
    const name = clientMatch[1].trim();
    const address = clientMatch[2]?.trim();
    return {
      type: 'client',
      name,
      address,
    };
  }

  // =========================================================================
  // 4. INTENTION : FORFAIT DÉPLACEMENT
  // Ex: "déplacement 50€", "forfait déplacement 45 euros", "frais de déplacement"
  // =========================================================================
  if (/d[ée]placement|frais\s+de\s+d[ée]placement|forfait\s+d[ée]placement/i.test(normalized)) {
    const pMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:€|euros?|euro|eur)?/i);
    const fee = pMatch ? parseFloat(pMatch[1].replace(',', '.')) : defaultTravelFee;
    return {
      type: 'item',
      item: {
        designation: 'Forfait déplacement',
        category: 'deplacement',
        quantity: 1,
        unit: 'forfait',
        unitPriceHT: fee > 0 ? fee : defaultTravelFee,
        vatRate: 10,
      },
    };
  }

  // =========================================================================
  // 5. INTENTION : LIGNE DE PRESTATION / FOURNITURE / MAIN D'OEUVRE
  // =========================================================================

  // A. Détection de la Pièce / Zone de chantier
  let detectedRoom: string | undefined = undefined;
  for (const r of ROOMS_DEFINITIONS) {
    if (r.regex.test(normalized)) {
      detectedRoom = r.name;
      break;
    }
  }

  // B. Détection du Prix
  let price = 0;
  const priceMatch = normalized.match(/(?:[àa]|pour|co[uû]t(?:e)?|\:)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?|euro|eur)\s*(?:ht|ttc)?/i);
  if (priceMatch && priceMatch[1]) {
    price = parseFloat(priceMatch[1].replace(',', '.'));
  }

  // C. Détection de l'Unité et Quantité
  let detectedUnit: 'u' | 'm²' | 'ml' | 'h' | 'forfait' | 'j' = 'forfait';
  let quantity = 1;
  let category: 'fourniture' | 'main_d_oeuvre' | 'deplacement' | 'forfait' = 'forfait';

  const hourMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:heures?|\bh\b)/i);
  if (hourMatch) {
    detectedUnit = 'h';
    quantity = parseFloat(hourMatch[1].replace(',', '.'));
    category = 'main_d_oeuvre';
    if (price === 0) {
      price = defaultHourlyRate; // Taux horaire par défaut si aucun montant précisé
    }
  } else if (/main\s*d['’]oeuvre/i.test(normalized)) {
    detectedUnit = 'h';
    category = 'main_d_oeuvre';
    if (price === 0) {
      price = defaultHourlyRate;
    }
  } else if (/m[èe]tres?\s*carr[ée]s?|m2|m²/i.test(normalized)) {
    detectedUnit = 'm²';
    const m2Match = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|m[èe]tres?\s*carr[ée]s?)/i);
    if (m2Match) quantity = parseFloat(m2Match[1].replace(',', '.'));
  } else if (/m[èe]tres?\s*lin[ée]aires?|ml\b/i.test(normalized)) {
    detectedUnit = 'ml';
    const mlMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|m[èe]tres?\s*lin[ée]aires?)/i);
    if (mlMatch) quantity = parseFloat(mlMatch[1].replace(',', '.'));
  } else {
    const qtyPattern = normalized.match(/(?:pose\s+de\s+|installation\s+de\s+|fourniture\s+de\s+|^)?(\d+)\s*(?:unit[ée]s?|pi[èe]ces?|chauffe-eau|radiateurs?|prises?|portes?|fen[êe]tres?)/i);
    if (qtyPattern && qtyPattern[1]) {
      quantity = parseFloat(qtyPattern[1]);
      detectedUnit = 'u';
      category = 'fourniture';
    }
  }

  // D. Détection du Taux de TVA adapté BTP France
  let vatRate: VatRate = 10;
  if (/pompe\s*[àa]\s*chaleur|pac|isolation|r[ée]novation\s*[ée]nerg[ée]tique|solaire|5\.5/i.test(normalized)) {
    vatRate = 5.5;
  } else if (/neuf|agrandissement|construction|mat[ée]riel\s*seul|20%/i.test(normalized)) {
    vatRate = 20;
  }

  // E. Nettoyage de la Désignation
  let cleanDesignation = text
    .replace(/(?:[àa]|pour|co[uû]t(?:e)?|\:)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?|euro|eur)\s*(?:ht|ttc)?/gi, '')
    .replace(/(?:dans\s+(?:la|le|les)?\s*)?(?:cuisine|salle\s+de\s+bains?|sdb|salon|s[ée]jour|chambre|wc|toilettes|ext[ée]rieur|terrasse|garage|cave|toiture|combles|couloir|entr[ée]e)/gi, '')
    .trim();

  // Supprimer les bruits de début de commande
  cleanDesignation = cleanDesignation.replace(/^(ajoute|cr[ée]e|mets?|ins[èe]re)\s+/i, '');

  // Si c'est de la main d'œuvre pure
  if (/^(\d+\s*h(?:eures?)?|\d+)?\s*(?:de\s+)?main\s*d['’]oeuvre$/i.test(cleanDesignation) || cleanDesignation.length === 0) {
    cleanDesignation = detectedRoom ? `Main d'œuvre (${detectedRoom.toLowerCase()})` : "Main d'œuvre";
  }

  // Nettoyage des virgules ou tirets résiduels
  cleanDesignation = cleanDesignation.replace(/^[,;\-\s]+|[,;\-\s]+$/g, '');

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
      unitPriceHT: price > 0 ? price : (category === 'main_d_oeuvre' ? defaultHourlyRate : 100),
      vatRate,
      room: detectedRoom,
      category,
    },
  };
}

// =========================================================================
// 6. PARSER DE FLUX CONTINU MULTI-PRESTATIONS (DICTÉE COMPLÈTE ON/OFF)
// Permet à l'artisan de dicter tout son chantier d'un seul coup.
// =========================================================================
export interface MultiVoiceDispatchResult {
  items: Array<Partial<QuoteItem>>;
  discount?: { discountType: 'percent' | 'fixed'; value: number };
  depositPercent?: number;
  client?: { name?: string; address?: string; phone?: string };
  summary: string;
}

export function parseContinuousVoiceSpeech(
  fullText: string,
  defaultHourlyRate = 65,
  defaultTravelFee = 50
): MultiVoiceDispatchResult {
  const result: MultiVoiceDispatchResult = {
    items: [],
    summary: '',
  };

  if (!fullText || !fullText.trim()) {
    result.summary = "Aucune parole détectée.";
    return result;
  }

  // 1. Dé-duplication des bégaiements d'Android Chrome Speech Recognition
  const cleanedText = deduplicateRepeatedPhrases(fullText);

  // 2. Découpage du flux continu en segments
  let processed = cleanedText;

  // A. Coupure sur ponctuation explicite (, ; . ! ?) et mots dits "virgule", "point"
  processed = processed
    .replace(/[,;!?\n]+/g, ' | ')
    .replace(/\b(?:virgule|point|à\s+la\s+ligne)\b/gi, ' | ');

  // B. Coupure après un prix suivi d'un mot alphabétique (ex: "150€ salle de bain" -> "150€ | salle de bain")
  processed = processed.replace(/(\d+\s*(?:€|euros?|euro|eur)\s*(?:ht|ttc)?)\s+(?=[a-zA-ZÀ-ÿ])/gi, '$1 | ');

  // C. Coupure avant les mots clés de rupture métier :
  const breakWords = [
    '(?:dans\\s+(?:la|le|les)?\\s*)?(?:cuisine|salle\\s+de\\s+bains?|sdb|salon|s[ée]jour|chambre|wc|toilettes|ext[ée]rieur|terrasse|garage|cave|toiture|combles|couloir|entr[ée]e)',
    '(?:d[ée]placement|forfait\\s+d[ée]placement|frais\\s+de\\s+d[ée]placement)',
    '(?:remise|rabais|r[ée]duction|geste\\s+commercial)',
    '(?:acompte)',
    '(?:client|pour\\s+m\\.|pour\\s+mme|pour\\s+monsieur|pour\\s+madame)',
    '(?:ensuite|puis|apr[èe]s|et\\s+aussi|de\\s+plus|ajoute\\s+[ée]galement)'
  ];
  const breakRegex = new RegExp(`\\s+(?:et\\s+)?(${breakWords.join('|')})\\b`, 'gi');
  processed = processed.replace(breakRegex, ' | $1');

  const segments = processed
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  let currentRoom: string | undefined = undefined;

  for (const seg of segments) {
    const intent = parseVoiceInputAdvanced(seg, defaultHourlyRate, defaultTravelFee);
    if (!intent) continue;

    if (intent.type === 'discount') {
      result.discount = {
        discountType: intent.discountType,
        value: intent.value,
      };
    } else if (intent.type === 'deposit') {
      result.depositPercent = intent.percent;
    } else if (intent.type === 'client') {
      result.client = {
        name: intent.name,
        address: intent.address,
      };
    } else if (intent.type === 'item') {
      const item = { ...intent.item };
      // Mémorisation de la zone de chantier active
      if (item.room) {
        currentRoom = item.room;
      } else if (currentRoom && item.category !== 'deplacement') {
        item.room = currentRoom;
      }

      // Dédoublonnage strict : évite d'ajouter plusieurs fois la même ligne (échos ou bégaiement audio)
      const isDuplicate = result.items.some(
        (existing) =>
          existing.designation?.toLowerCase().trim() === item.designation?.toLowerCase().trim() &&
          existing.room === item.room &&
          existing.unitPriceHT === item.unitPriceHT
      );
      if (!isDuplicate) {
        result.items.push(item);
      }
    }
  }

  // Fallback si aucun segment n'a matché
  if (result.items.length === 0 && !result.discount && !result.depositPercent && !result.client) {
    const singleIntent = parseVoiceInputAdvanced(cleanedText, defaultHourlyRate, defaultTravelFee);
    if (singleIntent) {
      if (singleIntent.type === 'item') result.items.push(singleIntent.item);
      if (singleIntent.type === 'discount') result.discount = { discountType: singleIntent.discountType, value: singleIntent.value };
      if (singleIntent.type === 'deposit') result.depositPercent = singleIntent.percent;
      if (singleIntent.type === 'client') result.client = { name: singleIntent.name, address: singleIntent.address };
    }
  }

  // Synthèse humaine rassurante pour l'artisan
  const parts: string[] = [];
  if (result.items.length > 0) {
    parts.push(`${result.items.length} prestation${result.items.length > 1 ? 's' : ''} ajoutée${result.items.length > 1 ? 's' : ''}`);
  }
  if (result.discount) {
    parts.push(`remise ${result.discount.value}${result.discount.discountType === 'percent' ? '%' : '€'}`);
  }
  if (result.depositPercent !== undefined) {
    parts.push(`acompte ${result.depositPercent}%`);
  }
  if (result.client?.name) {
    parts.push(`client ${result.client.name}`);
  }

  result.summary = parts.length > 0
    ? `✨ Traité avec succès : ${parts.join(', ')}.`
    : "⚠️ Analyse terminée, aucune ligne de devis reconnue.";

  return result;
}
