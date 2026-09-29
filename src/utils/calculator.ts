import type { QuoteItem, VatRate } from '../types';

export interface CalculationResult {
  totalBrutHT: number;
  discountAmountHT: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  depositAmountTTC: number;
  estimatedMarginHT: number;
  vatBreakdown: { [key in VatRate]?: { baseHT: number; vatAmount: number } };
}

export function calculateTotals(
  items: QuoteItem[],
  depositPercent: number = 30,
  discountType: 'percent' | 'fixed' = 'percent',
  discountValue: number = 0
): CalculationResult {
  let totalBrutHT = 0;
  let totalCostHT = 0;
  const rawVatBreakdown: { [key in VatRate]?: number } = {};

  items.forEach((item) => {
    const itemTotalHT = (item.quantity || 0) * (item.unitPriceHT || 0);
    const itemCostHT = (item.quantity || 0) * (item.costPriceHT || 0);
    totalBrutHT += itemTotalHT;
    totalCostHT += itemCostHT;

    const rate = item.vatRate;
    rawVatBreakdown[rate] = (rawVatBreakdown[rate] || 0) + itemTotalHT;
  });

  // Calcul remise
  let discountAmountHT = 0;
  if (discountValue > 0 && totalBrutHT > 0) {
    if (discountType === 'percent') {
      discountAmountHT = totalBrutHT * (discountValue / 100);
    } else {
      discountAmountHT = Math.min(discountValue, totalBrutHT);
    }
  }

  const totalHT = Math.max(0, totalBrutHT - discountAmountHT);
  const ratioAfterDiscount = totalBrutHT > 0 ? totalHT / totalBrutHT : 1;

  // Ventilation TVA après remise
  const vatBreakdown: { [key in VatRate]?: { baseHT: number; vatAmount: number } } = {};
  let totalTVA = 0;

  Object.entries(rawVatBreakdown).forEach(([rateStr, baseBrut]) => {
    const rate = parseFloat(rateStr) as VatRate;
    if (baseBrut && baseBrut > 0) {
      const discountedBase = baseBrut * ratioAfterDiscount;
      const vatAmount = discountedBase * (rate / 100);
      vatBreakdown[rate] = {
        baseHT: Math.round(discountedBase * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
      };
      totalTVA += vatAmount;
    }
  });

  const totalTTC = totalHT + totalTVA;
  const depositAmountTTC = totalTTC * (depositPercent / 100);
  const estimatedMarginHT = Math.max(0, totalHT - totalCostHT);

  return {
    totalBrutHT: Math.round(totalBrutHT * 100) / 100,
    discountAmountHT: Math.round(discountAmountHT * 100) / 100,
    totalHT: Math.round(totalHT * 100) / 100,
    totalTVA: Math.round(totalTVA * 100) / 100,
    totalTTC: Math.round(totalTTC * 100) / 100,
    depositAmountTTC: Math.round(depositAmountTTC * 100) / 100,
    estimatedMarginHT: Math.round(estimatedMarginHT * 100) / 100,
    vatBreakdown,
  };
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function generateQuoteNumber(existingQuotesCount: number): string {
  const currentYear = new Date().getFullYear();
  const sequence = String(existingQuotesCount + 1).padStart(3, '0');
  return `DEV-${currentYear}-${sequence}`;
}

export function generateInvoiceNumber(existingCount: number, type: 'acompte' | 'solde'): string {
  const currentYear = new Date().getFullYear();
  const prefix = type === 'acompte' ? 'FAC-AC' : 'FAC';
  const sequence = String(existingCount + 1).padStart(3, '0');
  return `${prefix}-${currentYear}-${sequence}`;
}

export function generateCreditNoteNumber(existingCount: number): string {
  const currentYear = new Date().getFullYear();
  const sequence = String(existingCount + 1).padStart(3, '0');
  return `AV-${currentYear}-${sequence}`;
}

export interface RoomGroup {
  roomName: string;
  items: QuoteItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export function groupItemsByRoom(items: QuoteItem[]): RoomGroup[] {
  const groups: { [key: string]: QuoteItem[] } = {};

  items.forEach((item) => {
    const room = item.room?.trim() || 'Prestations Générales';
    if (!groups[room]) {
      groups[room] = [];
    }
    groups[room].push(item);
  });

  return Object.entries(groups).map(([roomName, roomItems]) => {
    let totalHT = 0;
    let totalTVA = 0;

    roomItems.forEach((item) => {
      const itemHT = (item.quantity || 0) * (item.unitPriceHT || 0);
      totalHT += itemHT;
      totalTVA += itemHT * ((item.vatRate || 10) / 100);
    });

    return {
      roomName,
      items: roomItems,
      totalHT: Math.round(totalHT * 100) / 100,
      totalTVA: Math.round(totalTVA * 100) / 100,
      totalTTC: Math.round((totalHT + totalTVA) * 100) / 100,
    };
  });
}

export function parseVoiceInputToItem(text: string): Partial<QuoteItem> | null {
  const clean = text.trim();
  if (!clean) return null;

  const priceMatch = clean.match(/(\d+([.,]\d+)?)\s*(€|euros?|euro)/i);
  let price = 0;
  if (priceMatch && priceMatch[1]) {
    price = parseFloat(priceMatch[1].replace(',', '.'));
  }

  let quantity = 1;
  const qtyMatch = clean.match(/^(\d+)\s+/);
  if (qtyMatch && qtyMatch[1]) {
    quantity = parseInt(qtyMatch[1], 10);
  }

  return {
    designation: clean.replace(/(\d+([.,]\d+)?)\s*(€|euros?|euro)/i, '').trim(),
    quantity: quantity > 0 ? quantity : 1,
    unitPriceHT: price > 0 ? price : 100,
    vatRate: 10,
    unit: 'forfait',
  };
}
