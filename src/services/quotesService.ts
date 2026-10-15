import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Quote as LocalQuote } from '../types';

export interface QuoteItemInput {
  designation: string;
  description?: string;
  quantite: number;
  unite: string;
  prix_unitaire_ht: number;
  taux_tva: number; // 0, 5.5, 10, ou 20
}

export interface CreateQuoteInput {
  organizationId: string;
  numeroDevis: string;
  clientId?: string;
  dateEmission?: string;
  dateValidite?: string;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  acomptePourcentage?: number;
  acompteMontant?: number;
  signatureBase64?: string;
  signePar?: string;
  notesChantier?: string;
  items: QuoteItemInput[];
}

export interface SupabaseQuote {
  id: string;
  organization_id: string;
  client_id: string | null;
  numero_devis: string;
  date_emission: string;
  date_validite: string;
  statut: 'brouillon' | 'envoye' | 'signe' | 'acompte_regle' | 'refuse';
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  acompte_pourcentage: number;
  acompte_montant: number;
  signature_base64: string | null;
  signe_le: string | null;
  signe_par: string | null;
  partage_token: string;
  partage_whatsapp_envoye_le: string | null;
  notes_chantier: string | null;
  created_at: string;
  updated_at: string;
  clients?: any;
  quote_items?: any[];
  organizations?: any;
}

export const quotesService = {
  // 1. Créer un devis complet avec ses lignes d'ouvrages
  async createQuote(input: CreateQuoteInput): Promise<SupabaseQuote> {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase n'est pas configuré.");
    }

    // A. Insérer le devis principal
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        organization_id: input.organizationId,
        numero_devis: input.numeroDevis,
        client_id: input.clientId || null,
        date_emission: input.dateEmission || new Date().toISOString().split('T')[0],
        date_validite: input.dateValidite || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_ht: input.totalHt,
        total_tva: input.totalTva,
        total_ttc: input.totalTtc,
        acompte_pourcentage: input.acomptePourcentage || 30.0,
        acompte_montant: input.acompteMontant || Number((input.totalTtc * 0.3).toFixed(2)),
        signature_base64: input.signatureBase64 || null,
        signe_le: input.signatureBase64 ? new Date().toISOString() : null,
        signe_par: input.signePar || null,
        notes_chantier: input.notesChantier || null,
        statut: input.signatureBase64 ? 'signe' : 'brouillon',
      })
      .select()
      .single();

    if (quoteError) throw quoteError;

    // B. Insérer les lignes d'ouvrages associées
    if (input.items && input.items.length > 0) {
      const itemsToInsert = input.items.map((item, index) => ({
        quote_id: quote.id,
        ordre: index + 1,
        designation: item.designation,
        description: item.description || null,
        quantite: item.quantite,
        unite: item.unite || 'U',
        prix_unitaire_ht: item.prix_unitaire_ht,
        taux_tva: item.taux_tva,
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return quote as SupabaseQuote;
  },

  // 2. Récupérer tous les devis de l'artisan (avec client et items)
  async getQuotes(organizationId?: string): Promise<SupabaseQuote[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('quotes')
      .select('*, clients(*), quote_items(*)')
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as SupabaseQuote[];
  },

  // 3. Récupérer un devis spécifique par son ID
  async getQuoteById(quoteId: string): Promise<SupabaseQuote | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('quotes')
      .select('*, clients(*), quote_items(*)')
      .eq('id', quoteId)
      .maybeSingle();

    if (error) throw error;
    return data as SupabaseQuote | null;
  },

  // 4. Récupérer un devis public via son token WhatsApp (sans authentification requise)
  async getPublicQuoteByToken(token: string): Promise<SupabaseQuote | null> {
    if (!isSupabaseConfigured) return null;

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, organizations(*), clients(*), quote_items(*)')
      .eq('partage_token', token)
      .maybeSingle();

    if (error) throw error;
    return quote as SupabaseQuote | null;
  },

  // 5. Enregistrer la signature tactile du client (artisan connecté)
  async signQuote(quoteId: string, signatureBase64: string, signePar: string): Promise<SupabaseQuote> {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase n'est pas configuré.");
    }

    const { data, error } = await supabase
      .from('quotes')
      .update({
        signature_base64: signatureBase64,
        signe_le: new Date().toISOString(),
        signe_par: signePar,
        statut: 'signe',
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (error) throw error;
    return data as SupabaseQuote;
  },

  // 6. Signature publique au doigt par token (depuis lien WhatsApp client)
  async signPublicQuote(token: string, signatureBase64: string, signePar: string): Promise<SupabaseQuote> {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase n'est pas configuré.");
    }

    const { data, error } = await supabase
      .from('quotes')
      .update({
        signature_base64: signatureBase64,
        signe_le: new Date().toISOString(),
        signe_par: signePar,
        statut: 'signe',
      })
      .eq('partage_token', token)
      .select()
      .single();

    if (error) throw error;
    return data as SupabaseQuote;
  },

  // 7. Mettre à jour le statut du devis
  async updateQuoteStatus(
    quoteId: string, 
    statut: 'brouillon' | 'envoye' | 'signe' | 'acompte_regle' | 'refuse'
  ): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('quotes')
      .update({ statut, updated_at: new Date().toISOString() })
      .eq('id', quoteId);

    if (error) throw error;
  },

  // 8. Marquer le devis comme envoyé par WhatsApp
  async markWhatsAppSent(quoteId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('quotes')
      .update({
        partage_whatsapp_envoye_le: new Date().toISOString(),
        statut: 'envoye',
      })
      .eq('id', quoteId);

    if (error) throw error;
  },

  // 9. Supprimer un devis
  async deleteQuote(quoteId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId);

    if (error) throw error;
  },

  // 10. Helper de conversion d'un devis local de l'application vers CreateQuoteInput
  convertLocalQuoteToSupabase(
    localQuote: LocalQuote, 
    organizationId: string, 
    clientId?: string
  ): CreateQuoteInput {
    return {
      organizationId,
      numeroDevis: localQuote.number,
      clientId,
      dateEmission: localQuote.createdAt ? localQuote.createdAt.split('T')[0] : undefined,
      dateValidite: localQuote.validUntil ? localQuote.validUntil.split('T')[0] : undefined,
      totalHt: localQuote.totalHT,
      totalTva: localQuote.totalTVA,
      totalTtc: localQuote.totalTTC,
      acomptePourcentage: localQuote.depositPercent,
      acompteMontant: localQuote.depositAmountTTC,
      signatureBase64: localQuote.signatureDataUrl,
      signePar: localQuote.signedAt ? (localQuote.client.name || 'Client') : undefined,
      notesChantier: localQuote.notes,
      items: localQuote.items.map((item) => ({
        designation: item.designation,
        description: item.room ? `Zone: ${item.room}` : undefined,
        quantite: item.quantity,
        unite: item.unit,
        prix_unitaire_ht: item.unitPriceHT,
        taux_tva: item.vatRate,
      })),
    };
  },
};

export default quotesService;
