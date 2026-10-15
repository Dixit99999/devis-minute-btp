import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export interface ArtisanSignUpData {
  email: string;
  password?: string;
  companyName: string;
  fullName: string;
  phone?: string;
}

export interface ArtisanOrganization {
  id: string;
  name: string;
  siret?: string;
  tva_intracom?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  assurance_decennale_nom?: string;
  assurance_decennale_police?: string;
  assurance_decennale_zone?: string;
  logo_url?: string;
  created_at: string;
}

export interface ArtisanSubscription {
  id: string;
  organization_id: string;
  provider: 'stripe' | 'revenuecat';
  customer_id?: string;
  subscription_id?: string;
  plan_tier: 'starter' | 'pro' | 'scale';
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
  trial_ends_at: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
}

export interface ArtisanProfileData {
  user: User;
  organization: ArtisanOrganization;
  role: 'owner' | 'admin' | 'member';
  subscription: ArtisanSubscription | null;
}

export const authService = {
  // Inscription artisan : déclenche automatiquement le trigger SQL de création d'organisation et d'essai 14 jours
  async signUp({ email, password, companyName, fullName, phone }: ArtisanSignUpData) {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase n'est pas configuré. Veuillez renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || 'Artisan@2026!',
      options: {
        data: {
          company_name: companyName,
          full_name: fullName,
          phone: phone || '',
        },
      },
    });

    if (error) throw error;
    return data;
  },

  // Connexion email + mot de passe
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase n'est pas configuré.");
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Connexion sans mot de passe via Magic Link OTP (optimisé smartphone sur chantier)
  async signInWithOtp(email: string) {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase n'est pas configuré.");
    }
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) throw error;
    return data;
  },

  // Déconnexion
  async signOut() {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Récupérer la session courante
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Récupérer l'utilisateur courant
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  },

  // Récupérer l'organisation et le statut d'abonnement de l'artisan connecté
  async getCurrentArtisanProfile(): Promise<ArtisanProfileData | null> {
    if (!isSupabaseConfigured) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Récupérer le membre et l'organisation
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(*)')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member) return null;

    // Récupérer le statut d'abonnement
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', member.organization_id)
      .maybeSingle();

    return {
      user,
      organization: member.organizations as unknown as ArtisanOrganization,
      role: member.role as 'owner' | 'admin' | 'member',
      subscription: (subscription as unknown as ArtisanSubscription) || null,
    };
  },

  // Écouter les changements d'état d'authentification
  onAuthStateChange(callback: (session: Session | null) => void) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};

export default authService;
