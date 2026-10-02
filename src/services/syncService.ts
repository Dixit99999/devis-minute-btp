import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Quote, ArtisanProfile } from '../types';

/**
 * Service de Synchronisation Supabase / Offline-First
 * Garantit la persistance locale immédiate + réplication Cloud sécurisée
 */

// 1. Sauvegarder ou mettre à jour un devis dans Supabase
export async function syncQuoteToCloud(quote: Quote, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const payload = {
      id: quote.id,
      user_id: userId,
      number: quote.number,
      doc_type: quote.docType || 'devis',
      invoice_number: quote.invoiceNumber || null,
      credit_note_number: quote.creditNoteNumber || null,
      original_invoice_number: quote.originalInvoiceNumber || null,
      credit_note_reason: quote.creditNoteReason || null,
      created_at: quote.createdAt,
      valid_until: quote.validUntil,
      status: quote.status,
      client_name: quote.client.name || '',
      client_phone: quote.client.phone || '',
      client_email: quote.client.email || '',
      client_address: quote.client.address || '',
      client_postal_code: quote.client.postalCode || '',
      client_city: quote.client.city || '',
      items: quote.items || [],
      discount_type: quote.discountType || 'percent',
      discount_value: quote.discountValue || 0,
      deposit_percent: quote.depositPercent || 30,
      deposit_amount_ttc: quote.depositAmountTTC || 0,
      total_ht: quote.totalHT || 0,
      total_tva: quote.totalTVA || 0,
      total_ttc: quote.totalTTC || 0,
      signature_data_url: quote.signatureDataUrl || null,
      signed_at: quote.signedAt || null,
      photos: quote.photos || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('quotes')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[SyncService] Erreur lors de la synchro du devis vers le Cloud :', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[SyncService] Exception Cloud :', err);
    return false;
  }
}

// 2. Récupérer tous les devis de l'artisan depuis Supabase
export async function fetchQuotesFromCloud(userId: string): Promise<Quote[] | null> {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) {
      console.warn('[SyncService] Impossible de récupérer les devis Cloud :', error?.message);
      return null;
    }

    return data.map((row: any) => ({
      id: row.id,
      number: row.number,
      docType: row.doc_type,
      invoiceNumber: row.invoice_number,
      creditNoteNumber: row.credit_note_number,
      originalInvoiceNumber: row.original_invoice_number,
      creditNoteReason: row.credit_note_reason,
      createdAt: row.created_at,
      validUntil: row.valid_until,
      status: row.status,
      client: {
        name: row.client_name,
        phone: row.client_phone,
        email: row.client_email,
        address: row.client_address,
        postalCode: row.client_postal_code,
        city: row.client_city,
      },
      items: row.items || [],
      discountType: row.discount_type,
      discountValue: Number(row.discount_value) || 0,
      discountAmountHT: 0,
      depositPercent: Number(row.deposit_percent) || 30,
      depositAmountTTC: Number(row.deposit_amount_ttc) || 0,
      signatureDataUrl: row.signature_data_url,
      signedAt: row.signed_at,
      photos: row.photos || [],
      totalBrutHT: Number(row.total_ht) || 0,
      totalHT: Number(row.total_ht) || 0,
      totalTVA: Number(row.total_tva) || 0,
      totalTTC: Number(row.total_ttc) || 0,
      vatBreakdown: {},
    }));
  } catch (err) {
    console.warn('[SyncService] Exception fetch Cloud :', err);
    return null;
  }
}

// 3. Sauvegarder le profil de l'artisan dans Supabase
export async function syncProfileToCloud(profile: ArtisanProfile, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId) return false;

  try {
    const payload = {
      id: userId,
      company_name: profile.companyName,
      trade: profile.trade,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      postal_code: profile.postalCode,
      city: profile.city,
      siret: profile.siret,
      tva_number: profile.tvaIntra,
      decennale_company: profile.decennaleCompany,
      decennale_police_number: profile.decennalePoliceNumber,
      rib_iban: profile.ribIban,
      rib_bic: profile.ribBic,
      default_hourly_rate: profile.defaultHourlyRate,
      notification_phone: profile.notificationPhone || '',
      send_sms_on_sign: profile.sendSmsOnSign ?? true,
      send_email_on_sign: profile.sendEmailOnSign ?? true,
      webhook_url: profile.webhookUrl || '',
      is_onboarded: profile.isOnboarded ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[SyncService] Erreur mise à jour profil Cloud :', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[SyncService] Exception profil Cloud :', err);
    return false;
  }
}

// 4. Récupérer le profil de l'artisan depuis Supabase
export async function fetchProfileFromCloud(userId: string): Promise<Partial<ArtisanProfile> | null> {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      companyName: data.company_name,
      trade: data.trade,
      phone: data.phone,
      email: data.email,
      address: data.address,
      postalCode: data.postal_code,
      city: data.city,
      siret: data.siret,
      tvaIntra: data.tva_number,
      decennaleCompany: data.decennale_company,
      decennalePoliceNumber: data.decennale_police_number,
      ribIban: data.rib_iban,
      ribBic: data.rib_bic,
      defaultHourlyRate: Number(data.default_hourly_rate) || 60,
      notificationPhone: data.notification_phone,
      sendSmsOnSign: data.send_sms_on_sign,
      sendEmailOnSign: data.send_email_on_sign,
      webhookUrl: data.webhook_url,
      isOnboarded: data.is_onboarded,
    };
  } catch (err) {
    return null;
  }
}
