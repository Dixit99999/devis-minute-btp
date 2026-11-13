import type { Quote, ArtisanProfile, VatRate } from '../types';

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  onlyPaidOrSigned: boolean;
}

/**
 * Filtre les devis selon les critères choisis
 */
export function filterQuotesForExport(quotes: Quote[], filters: ExportFilters): Quote[] {
  return quotes.filter(q => {
    if (filters.onlyPaidOrSigned && !['signe', 'acompte_paye', 'facture_acompte', 'facture_solde'].includes(q.status)) {
      return false;
    }
    if (filters.startDate && q.createdAt < filters.startDate) {
      return false;
    }
    if (filters.endDate && q.createdAt > filters.endDate + 'T23:59:59') {
      return false;
    }
    return true;
  });
}

/**
 * Calcule la synthèse de TVA et CA par taux
 */
export function calculateVatAndRevenueSummary(quotes: Quote[]) {
  const summary = {
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    totalDepositsCollected: 0,
    byVatRate: {
      20: { baseHT: 0, vatAmount: 0 },
      10: { baseHT: 0, vatAmount: 0 },
      5.5: { baseHT: 0, vatAmount: 0 },
      0: { baseHT: 0, vatAmount: 0 },
    } as Record<VatRate, { baseHT: number; vatAmount: number }>,
    countTotal: quotes.length,
    countSigned: quotes.filter(q => ['signe', 'acompte_paye', 'facture_acompte', 'facture_solde'].includes(q.status)).length,
    countDeposits: quotes.filter(q => ['acompte_paye', 'facture_acompte', 'facture_solde'].includes(q.status)).length,
  };

  quotes.forEach(quote => {
    const isCreditNote = quote.docType === 'avoir';
    const multiplier = isCreditNote ? -1 : 1;

    summary.totalHT += (quote.totalHT || 0) * multiplier;
    summary.totalTVA += (quote.totalTVA || 0) * multiplier;
    summary.totalTTC += (quote.totalTTC || 0) * multiplier;

    if (!isCreditNote && ['acompte_paye', 'facture_acompte', 'facture_solde'].includes(quote.status)) {
      summary.totalDepositsCollected += quote.depositAmountTTC || 0;
    }

    if (quote.vatBreakdown) {
      ([20, 10, 5.5, 0] as VatRate[]).forEach(rate => {
        const item = quote.vatBreakdown[rate];
        if (item) {
          summary.byVatRate[rate].baseHT += (item.baseHT || 0) * multiplier;
          summary.byVatRate[rate].vatAmount += (item.vatAmount || 0) * multiplier;
        }
      });
    }
  });

  return summary;
}

/**
 * Génère le fichier CSV du Journal des Ventes & Acomptes (Compatible Excel, Google Sheets, Pennylane)
 */
export function generateSalesJournalCSV(quotes: Quote[], artisan: ArtisanProfile): string {
  const headers = [
    'Date Création',
    'Date Signature',
    'N° Devis / Facture',
    'Statut',
    'Client',
    'Téléphone',
    'Email',
    'Adresse Chantier',
    'Total HT (€)',
    'TVA 20% Base HT',
    'TVA 20% Montant',
    'TVA 10% Base HT',
    'TVA 10% Montant',
    'TVA 5.5% Base HT',
    'TVA 5.5% Montant',
    'Total TVA (€)',
    'Total TTC (€)',
    'Taux Acompte (%)',
    'Acompte TTC (€)',
    'Acompte Encaissé',
    'Reste à Payer TTC (€)',
  ];

  const rows = quotes.map(q => {
    const isCreditNote = q.docType === 'avoir';
    const multiplier = isCreditNote ? -1 : 1;
    const isDepositPaid = !isCreditNote && ['acompte_paye', 'facture_acompte', 'facture_solde'].includes(q.status);
    const depositAmount = isCreditNote ? 0 : (q.depositAmountTTC || 0);
    const remainingToPay = isCreditNote ? 0 : Math.max(0, (q.totalTTC || 0) - (isDepositPaid ? depositAmount : 0));

    const tva20 = q.vatBreakdown?.[20] || { baseHT: 0, vatAmount: 0 };
    const tva10 = q.vatBreakdown?.[10] || { baseHT: 0, vatAmount: 0 };
    const tva55 = q.vatBreakdown?.[5.5] || { baseHT: 0, vatAmount: 0 };

    const docNum = isCreditNote ? (q.creditNoteNumber || q.number) : (q.invoiceNumber || q.number);

    return [
      q.createdAt ? q.createdAt.split('T')[0] : '',
      q.signedAt ? q.signedAt.split('T')[0] : '',
      `"${docNum}"`,
      `"${isCreditNote ? 'Avoir' : q.status}"`,
      `"${(q.client?.name || '').replace(/"/g, '""')}"`,
      `"${q.client?.phone || ''}"`,
      `"${q.client?.email || ''}"`,
      `"${(q.client?.address || '').replace(/"/g, '""')} ${q.client?.city || ''}"`,
      (q.totalHT * multiplier).toFixed(2),
      (tva20.baseHT * multiplier).toFixed(2),
      (tva20.vatAmount * multiplier).toFixed(2),
      (tva10.baseHT * multiplier).toFixed(2),
      (tva10.vatAmount * multiplier).toFixed(2),
      (tva55.baseHT * multiplier).toFixed(2),
      (tva55.vatAmount * multiplier).toFixed(2),
      (q.totalTVA * multiplier).toFixed(2),
      (q.totalTTC * multiplier).toFixed(2),
      isCreditNote ? 0 : (q.depositPercent || 0),
      depositAmount.toFixed(2),
      isDepositPaid ? 'OUI' : 'NON',
      remainingToPay.toFixed(2),
    ].join(';');
  });

  // Entête BOM UTF-8 pour ouverture parfaite dans Excel Windows
  return '\uFEFF' + [
    `# Journal des Ventes & Encaissements — ${artisan.companyName || 'Artisan'} (SIRET: ${artisan.siret || 'N/A'})`,
    `# Généré le ${new Date().toLocaleDateString('fr-FR')} via Devis Minute BTP`,
    headers.join(';'),
    ...rows,
  ].join('\r\n');
}

/**
 * Génère le FEC (Fichier des Écritures Comptables) conforme à l'article A.47 A-1 du LPF
 * Format tabulé officiel (JournalCode, EcritureNum, EcritureDate, CompteNum, etc.)
 */
export function generateFECFile(quotes: Quote[], _artisan: ArtisanProfile): string {
  // Champs FEC obligatoires (18 colonnes)
  const fecHeaders = [
    'JournalCode',
    'JournalLib',
    'EcritureNum',
    'EcritureDate',
    'CompteNum',
    'CompteLib',
    'CompAuxNum',
    'CompAuxLib',
    'PieceRef',
    'PieceDate',
    'EcritureLib',
    'Debit',
    'Credit',
    'EcritureLet',
    'DateLet',
    'ValidDate',
    'Montantdevise',
    'Idevise',
  ];

  const lines: string[] = [fecHeaders.join('\t')];
  let ecritureCounter = 1;

  quotes.forEach(quote => {
    const isSignedOrPaid = ['signe', 'acompte_paye', 'facture_acompte', 'facture_solde'].includes(quote.status);
    if (!isSignedOrPaid) return;

    const dateStr = (quote.signedAt || quote.createdAt || new Date().toISOString()).split('T')[0].replace(/-/g, '');
    const pieceRef = quote.number;
    const clientName = (quote.client?.name || 'Client Divers').replace(/[\t\n\r]/g, ' ');
    const ecritureNum = `ECR${String(ecritureCounter).padStart(5, '0')}`;
    ecritureCounter++;

    // 1. Débit Compte Client 411000 (TTC)
    lines.push([
      'VT', // Journal des Ventes
      'Ventes Prestations BTP',
      ecritureNum,
      dateStr,
      '411000',
      'Clients',
      `CL_${(quote.client?.name || 'DIV').slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
      clientName,
      pieceRef,
      dateStr,
      `Facture/Devis signé ${pieceRef} - ${clientName}`,
      quote.totalTTC.toFixed(2).replace('.', ','),
      '0,00',
      '',
      '',
      dateStr,
      '',
      '',
    ].join('\t'));

    // 2. Crédit Compte 706000 (Prestations de Services / Travaux HT)
    lines.push([
      'VT',
      'Ventes Prestations BTP',
      ecritureNum,
      dateStr,
      '706000',
      'Prestations Travaux & Dépannage',
      '',
      '',
      pieceRef,
      dateStr,
      `Travaux HT ${pieceRef} - ${clientName}`,
      '0,00',
      quote.totalHT.toFixed(2).replace('.', ','),
      '',
      '',
      dateStr,
      '',
      '',
    ].join('\t'));

    // 3. Crédit TVA Collectée par taux
    if (quote.vatBreakdown) {
      if (quote.vatBreakdown[20] && quote.vatBreakdown[20]!.vatAmount > 0) {
        lines.push([
          'VT',
          'Ventes Prestations BTP',
          ecritureNum,
          dateStr,
          '445711',
          'TVA Collectee 20%',
          '',
          '',
          pieceRef,
          dateStr,
          `TVA 20% sur ${pieceRef}`,
          '0,00',
          quote.vatBreakdown[20]!.vatAmount.toFixed(2).replace('.', ','),
          '',
          '',
          dateStr,
          '',
          '',
        ].join('\t'));
      }
      if (quote.vatBreakdown[10] && quote.vatBreakdown[10]!.vatAmount > 0) {
        lines.push([
          'VT',
          'Ventes Prestations BTP',
          ecritureNum,
          dateStr,
          '445712',
          'TVA Collectee 10%',
          '',
          '',
          pieceRef,
          dateStr,
          `TVA 10% sur ${pieceRef}`,
          '0,00',
          quote.vatBreakdown[10]!.vatAmount.toFixed(2).replace('.', ','),
          '',
          '',
          dateStr,
          '',
          '',
        ].join('\t'));
      }
      if (quote.vatBreakdown[5.5] && quote.vatBreakdown[5.5]!.vatAmount > 0) {
        lines.push([
          'VT',
          'Ventes Prestations BTP',
          ecritureNum,
          dateStr,
          '445713',
          'TVA Collectee 5.5%',
          '',
          '',
          pieceRef,
          dateStr,
          `TVA 5.5% sur ${pieceRef}`,
          '0,00',
          quote.vatBreakdown[5.5]!.vatAmount.toFixed(2).replace('.', ','),
          '',
          '',
          dateStr,
          '',
          '',
        ].join('\t'));
      }
    }

    // 4. Si acompte payé : Écriture de Règlement / Banque
    if (['acompte_paye', 'facture_acompte', 'facture_solde'].includes(quote.status) && (quote.depositAmountTTC || 0) > 0) {
      const bqEcritureNum = `ECR${String(ecritureCounter).padStart(5, '0')}`;
      ecritureCounter++;
      const depositAmount = (quote.depositAmountTTC || 0).toFixed(2).replace('.', ',');

      // Débit 512000 (Banque)
      lines.push([
        'BQ',
        'Banque / Encaissements Stripe CB',
        bqEcritureNum,
        dateStr,
        '512000',
        'Banque',
        '',
        '',
        `AC-${pieceRef}`,
        dateStr,
        `Reglement Acompte ${pieceRef} - ${clientName}`,
        depositAmount,
        '0,00',
        '',
        '',
        dateStr,
        '',
        '',
      ].join('\t'));

      // Crédit 411000 (Client soldé partiellement)
      lines.push([
        'BQ',
        'Banque / Encaissements Stripe CB',
        bqEcritureNum,
        dateStr,
        '411000',
        'Clients',
        `CL_${(quote.client?.name || 'DIV').slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
        clientName,
        `AC-${pieceRef}`,
        dateStr,
        `Reglement Acompte ${pieceRef} - ${clientName}`,
        '0,00',
        depositAmount,
        '',
        '',
        dateStr,
        '',
        '',
      ].join('\t'));
    }
  });

  return lines.join('\r\n');
}

/**
 * Échappe les caractères spéciaux pour un document XML valide
 */
function escapeXml(unsafe: string | undefined | null): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convertit l'unité BTP en code UN/ECE Rec 20 normalisé EN 16931
 */
function mapUnitToUnEce(unit: string): string {
  switch (unit) {
    case 'h':
      return 'HUR'; // Heure
    case 'j':
      return 'DAY'; // Jour
    case 'm²':
      return 'MTK'; // Mètre carré
    case 'ml':
      return 'MTR'; // Mètre linéaire
    case 'u':
    case 'forfait':
    default:
      return 'C62'; // Unité / Forfait
  }
}

/**
 * Génère le fichier XML Factur-X 1.0.07 (Profil EN 16931 / UN/CEFACT CrossIndustryInvoice D16B)
 * Compatible Plateformes Agréées (PA / PDP) : Pennylane, Chorus Pro, Sage, Cegid, Tiime (Réforme 2026/2027)
 */
export function generateFacturXXml(quote: Quote, artisan: ArtisanProfile): string {
  const isCreditNote = quote.docType === 'avoir';
  const isDepositInvoice = quote.docType === 'facture_acompte';
  const isFinalInvoice = quote.docType === 'facture_solde';

  // TypeCode UNTDID 1001 : 380 = Facture commerciale, 386 = Facture d'acompte, 381 = Avoir, 325 = Devis/Proforma
  const typeCode = isCreditNote ? '381' : isDepositInvoice ? '386' : isFinalInvoice ? '380' : '380';
  const docNumber = isCreditNote
    ? (quote.creditNoteNumber || quote.number)
    : (quote.invoiceNumber || quote.number);

  const rawDate = (quote.signedAt || quote.createdAt || new Date().toISOString()).split('T')[0];
  const issueDate102 = rawDate.replace(/-/g, '').slice(0, 8);
  const siren = (artisan.siret || '00000000000000').replace(/\s/g, '').slice(0, 9);
  const siret = (artisan.siret || '00000000000000').replace(/\s/g, '');
  const tvaIntra = (artisan.tvaIntra || `FR00${siren}`).replace(/\s/g, '');

  // Lignes du document (IncludedSupplyChainTradeLineItem)
  const lineItemsXml = (quote.items || [])
    .map((item, idx) => {
      const lineTotalHT = ((item.quantity || 0) * (item.unitPriceHT || 0)).toFixed(2);
      const unitCode = mapUnitToUnEce(item.unit);
      const vatCatCode = item.vatRate === 0 ? 'Z' : 'S';

      return `    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${idx + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(item.designation)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${(item.unitPriceHT || 0).toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${unitCode}">${(item.quantity || 1).toFixed(2)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${vatCatCode}</ram:CategoryCode>
          <ram:RateApplicablePercent>${Number(item.vatRate).toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${lineTotalHT}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join('\n');

  // Ventilation TVA (ApplicableTradeTax)
  const vatEntries = Object.entries(quote.vatBreakdown || {}).filter(
    ([, vals]) => vals && vals.baseHT > 0
  );

  const tradeTaxesXml =
    vatEntries.length > 0
      ? vatEntries
          .map(([rate, vals]) => {
            const numRate = Number(rate);
            const catCode = numRate === 0 ? 'Z' : 'S';
            return `      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${(vals?.vatAmount || 0).toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${(vals?.baseHT || 0).toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>${catCode}</ram:CategoryCode>
        <ram:RateApplicablePercent>${numRate.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`;
          })
          .join('\n')
      : `      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${(quote.totalTVA || 0).toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${(quote.totalHT || 0).toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`;

  const prepaidAmount =
    isFinalInvoice && (quote.depositAmountTTC || 0) > 0 ? quote.depositAmountTTC : 0;
  const duePayableAmount = Math.max(0, (quote.totalTTC || 0) - prepaidAmount);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(docNumber)}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDate102}</udt:DateTimeString>
    </ram:IssueDateTime>
    <ram:IncludedNote>
      <ram:Content>Document généré par Devis Minute BTP — Norme Factur-X EN 16931 (Compatible Plateforme Agréée Pennylane). Assurance Décennale : ${escapeXml(artisan.decennaleCompany)} Police n° ${escapeXml(artisan.decennalePoliceNumber)}.</ram:Content>
    </ram:IncludedNote>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
${lineItemsXml}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(artisan.companyName)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXml(siret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(artisan.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(artisan.address)}</ram:LineOne>
          <ram:CityName>${escapeXml(artisan.city)}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(tvaIntra)}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(quote.client?.name || 'Client')}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(quote.client?.postalCode || '')}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(quote.client?.address || '')}</ram:LineOne>
          <ram:CityName>${escapeXml(quote.client?.city || '')}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${issueDate102}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>30</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${escapeXml((artisan.ribIban || '').replace(/\s/g, ''))}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>
${tradeTaxesXml}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${(quote.totalBrutHT || quote.totalHT || 0).toFixed(2)}</ram:LineTotalAmount>
        <ram:AllowanceTotalAmount>${(quote.discountAmountHT || 0).toFixed(2)}</ram:AllowanceTotalAmount>
        <ram:TaxBasisTotalAmount>${(quote.totalHT || 0).toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${(quote.totalTVA || 0).toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${(quote.totalTTC || 0).toFixed(2)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>${prepaidAmount.toFixed(2)}</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${duePayableAmount.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

/**
 * Génère un lot XML Factur-X (Batch EN 16931) pour l'ensemble des pièces de la période sélectionnée
 */
export function generateFacturXBatchXml(quotes: Quote[], artisan: ArtisanProfile): string {
  if (quotes.length === 1) {
    return generateFacturXXml(quotes[0], artisan);
  }
  const items = quotes
    .map((q) => {
      const xml = generateFacturXXml(q, artisan).replace(
        '<?xml version="1.0" encoding="UTF-8"?>\n',
        ''
      );
      return `  <!-- Pièce : ${escapeXml(q.invoiceNumber || q.creditNoteNumber || q.number)} (${escapeXml(q.client?.name)}) -->\n${xml}`;
    })
    .join('\n\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<FacturXBatch xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" profile="urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931" count="${quotes.length}">\n${items}\n</FacturXBatch>`;
}

/**
 * Télécharge un fichier dans le navigateur client
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
