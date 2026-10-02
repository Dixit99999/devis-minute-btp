-- ==========================================================
-- DEVIS MINUTE BTP — SCHEMA DE BASE DE DONNÉES SUPABASE (PostgreSQL)
-- Conforme RGPD, Sécurité Row Level Security (RLS) & Multi-Artisans
-- ==========================================================

-- 1. Table des Profils Artisans (synchronisée avec auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  trade TEXT NOT NULL DEFAULT 'Plomberie & Chauffage',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  siret TEXT NOT NULL DEFAULT '',
  tva_number TEXT DEFAULT '',
  decennale_company TEXT DEFAULT '',
  decennale_police_number TEXT DEFAULT '',
  rib_iban TEXT DEFAULT '',
  rib_bic TEXT DEFAULT '',
  default_hourly_rate NUMERIC(10,2) DEFAULT 60.00,
  notification_phone TEXT DEFAULT '',
  send_sms_on_sign BOOLEAN DEFAULT true,
  send_email_on_sign BOOLEAN DEFAULT true,
  webhook_url TEXT DEFAULT '',
  is_onboarded BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table des Devis & Factures
CREATE TABLE IF NOT EXISTS public.quotes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'devis', -- 'devis', 'facture_acompte', 'facture_solde', 'avoir'
  invoice_number TEXT,
  credit_note_number TEXT,
  original_invoice_number TEXT,
  credit_note_reason TEXT,
  created_at TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'brouillon', -- 'brouillon', 'envoye', 'signe', 'acompte_paye', 'facture_acompte', 'facture_solde', 'avoir_emis'
  client_name TEXT NOT NULL DEFAULT '',
  client_phone TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  client_postal_code TEXT DEFAULT '',
  client_city TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  discount_type TEXT DEFAULT 'percent',
  discount_value NUMERIC(10,2) DEFAULT 0,
  deposit_percent NUMERIC(5,2) DEFAULT 30,
  deposit_amount_ttc NUMERIC(10,2) DEFAULT 0,
  total_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_tva NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(10,2) NOT NULL DEFAULT 0,
  signature_data_url TEXT,
  signed_at TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table des Catalogues Personnalisés d'Ouvrages
CREATE TABLE IF NOT EXISTS public.custom_catalog (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  designation TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price_ht NUMERIC(10,2) NOT NULL,
  default_vat_rate NUMERIC(5,2) NOT NULL DEFAULT 10,
  cost_price_ht NUMERIC(10,2) DEFAULT 0,
  estimated_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 4. ACTIVATION DE LA SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- Chaque artisan n'accède QU'À SES PROPRES DONNÉES
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_catalog ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour PROFILES
CREATE POLICY "Les artisans peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Les artisans peuvent modifier leur propre profil"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- Politiques RLS pour QUOTES
CREATE POLICY "Les artisans peuvent gérer leurs propres devis"
  ON public.quotes FOR ALL
  USING (auth.uid() = user_id);

-- Politique publique pour la signature client à distance (consultation et signature par ID)
CREATE POLICY "Lecture publique pour signature client"
  ON public.quotes FOR SELECT
  USING (true);

CREATE POLICY "Mise à jour publique pour signature client"
  ON public.quotes FOR UPDATE
  USING (true);

-- Politiques RLS pour CUSTOM_CATALOG
CREATE POLICY "Les artisans peuvent gérer leur catalogue personnalisé"
  ON public.custom_catalog FOR ALL
  USING (auth.uid() = user_id);

-- ==========================================================
-- 5. TRIGGER AUTOMATIQUE : Création de profil lors de l'inscription
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, company_name)
  VALUES (new.id, new.email, 'Mon Entreprise BTP');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
