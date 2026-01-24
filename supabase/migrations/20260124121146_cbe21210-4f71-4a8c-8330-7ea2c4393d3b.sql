
-- =====================================================
-- MULTI-TENANT GAMING PLATFORM SCHEMA
-- 29 Patta - Complete Database Foundation
-- =====================================================

-- =====================================================
-- PHASE 1: ENUMS
-- =====================================================

-- Role hierarchy enum
CREATE TYPE public.app_role AS ENUM (
  'master_super_admin',
  'super_admin',
  'broker',
  'player'
);

-- Wallet transaction types
CREATE TYPE public.wallet_tx_type AS ENUM (
  'deposit',
  'withdrawal',
  'bet',
  'win',
  'rake',
  'bonus',
  'transfer'
);

-- Config versioning status
CREATE TYPE public.config_status AS ENUM (
  'draft',
  'validated',
  'published'
);

-- Game session status
CREATE TYPE public.game_status AS ENUM (
  'waiting',
  'playing',
  'finished'
);

-- =====================================================
-- PHASE 2: CORE TABLES
-- =====================================================

-- Tenants table - Multi-tenant isolation boundary
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table - User profiles linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table - RBAC separate from profiles for security
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'player',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index for user_roles (user can have one role per tenant, or one global role)
CREATE UNIQUE INDEX idx_user_roles_unique ON public.user_roles (user_id, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Broker-player assignments
CREATE TABLE public.broker_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(broker_user_id, player_user_id)
);

-- =====================================================
-- PHASE 3: WALLET SYSTEM
-- =====================================================

-- Wallets table - Player chip balances
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  available BIGINT NOT NULL DEFAULT 0 CHECK (available >= 0),
  locked BIGINT NOT NULL DEFAULT 0 CHECK (locked >= 0),
  bonus BIGINT NOT NULL DEFAULT 0 CHECK (bonus >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index for wallets (one wallet per user per tenant)
CREATE UNIQUE INDEX idx_wallets_unique ON public.wallets (user_id, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Wallet transactions - Immutable ledger
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  type public.wallet_tx_type NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  reference_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PHASE 4: GOVERNANCE TABLES
-- =====================================================

-- Audit logs - Immutable action logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Config versions - Draft/Validate/Publish workflow
CREATE TABLE public.config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config_type TEXT NOT NULL,
  config_data JSONB NOT NULL DEFAULT '{}',
  status public.config_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PHASE 5: GAME TABLES
-- =====================================================

-- Game tables - Table configurations per tenant
CREATE TABLE public.game_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'classic' CHECK (room_type IN ('classic', 'coldsoul')),
  min_buy_in BIGINT NOT NULL DEFAULT 1000,
  max_buy_in BIGINT NOT NULL DEFAULT 10000,
  small_blind BIGINT NOT NULL DEFAULT 10,
  big_blind BIGINT NOT NULL DEFAULT 20,
  max_players INT NOT NULL DEFAULT 6 CHECK (max_players >= 2 AND max_players <= 9),
  rake_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (rake_percentage >= 0 AND rake_percentage <= 20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game sessions - Active games
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  game_table_id UUID NOT NULL REFERENCES public.game_tables(id) ON DELETE CASCADE,
  status public.game_status NOT NULL DEFAULT 'waiting',
  pot BIGINT NOT NULL DEFAULT 0,
  current_player_index INT,
  dealer_index INT NOT NULL DEFAULT 0,
  round INT NOT NULL DEFAULT 0,
  game_state JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game players - Players in sessions
CREATE TABLE public.game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  seat_position INT NOT NULL CHECK (seat_position >= 0 AND seat_position < 9),
  chips BIGINT NOT NULL DEFAULT 0,
  hand JSONB DEFAULT '[]',
  bet BIGINT NOT NULL DEFAULT 0,
  has_folded BOOLEAN NOT NULL DEFAULT false,
  is_current BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_session_id, seat_position),
  UNIQUE(game_session_id, user_id)
);

-- =====================================================
-- PHASE 6: INDEXES
-- =====================================================

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallets_tenant_id ON public.wallets(tenant_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_tenant_id ON public.wallet_transactions(tenant_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_game_sessions_tenant_id ON public.game_sessions(tenant_id);
CREATE INDEX idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX idx_game_players_user_id ON public.game_players(user_id);
CREATE INDEX idx_broker_players_broker ON public.broker_players(broker_user_id);
CREATE INDEX idx_broker_players_player ON public.broker_players(player_user_id);

-- =====================================================
-- PHASE 7: SECURITY DEFINER FUNCTIONS
-- =====================================================

-- Check if user is Master Super Admin (tenant_id IS NULL)
CREATE OR REPLACE FUNCTION public.is_master_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'master_super_admin'
      AND tenant_id IS NULL
  )
$$;

-- Check if user has Super Admin role for a tenant
CREATE OR REPLACE FUNCTION public.is_super_admin_of_tenant(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = 'super_admin'
  ) OR public.is_master_super_admin(_user_id)
$$;

-- Check if user has any role in a tenant
CREATE OR REPLACE FUNCTION public.has_tenant_access(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (tenant_id = _tenant_id OR tenant_id IS NULL)
  )
$$;

-- Get user's role in a tenant
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID, _tenant_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id AND tenant_id IS NULL),
    (SELECT role FROM public.user_roles WHERE user_id = _user_id AND tenant_id = _tenant_id)
  )
$$;

-- Check if broker manages a player
CREATE OR REPLACE FUNCTION public.is_broker_of_player(_broker_user_id UUID, _player_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.broker_players
    WHERE broker_user_id = _broker_user_id
      AND player_user_id = _player_user_id
  )
$$;

-- Check if user is in a game session
CREATE OR REPLACE FUNCTION public.is_player_in_session(_user_id UUID, _session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_players
    WHERE user_id = _user_id
      AND game_session_id = _session_id
  )
$$;

-- Get user's tenant ID from profile
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id
$$;

-- =====================================================
-- PHASE 8: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 9: RLS POLICIES
-- =====================================================

-- TENANTS policies
CREATE POLICY "Master admins can do anything with tenants"
ON public.tenants FOR ALL
TO authenticated
USING (public.is_master_super_admin(auth.uid()))
WITH CHECK (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT
TO authenticated
USING (id = public.get_user_tenant_id(auth.uid()));

-- PROFILES policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Master admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can view tenant profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_super_admin_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Brokers can view assigned players profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_broker_of_player(auth.uid(), user_id));

-- USER_ROLES policies
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Master admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_master_super_admin(auth.uid()))
WITH CHECK (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage tenant roles except master"
ON public.user_roles FOR ALL
TO authenticated
USING (
  public.is_super_admin_of_tenant(auth.uid(), tenant_id)
  AND role != 'master_super_admin'
)
WITH CHECK (
  public.is_super_admin_of_tenant(auth.uid(), tenant_id)
  AND role != 'master_super_admin'
);

-- BROKER_PLAYERS policies
CREATE POLICY "Master admins can manage broker assignments"
ON public.broker_players FOR ALL
TO authenticated
USING (public.is_master_super_admin(auth.uid()))
WITH CHECK (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage tenant broker assignments"
ON public.broker_players FOR ALL
TO authenticated
USING (public.is_super_admin_of_tenant(auth.uid(), tenant_id))
WITH CHECK (public.is_super_admin_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Brokers can view their assignments"
ON public.broker_players FOR SELECT
TO authenticated
USING (broker_user_id = auth.uid());

-- WALLETS policies
CREATE POLICY "Users can view own wallet"
ON public.wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Master admins can view all wallets"
ON public.wallets FOR SELECT
TO authenticated
USING (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can view tenant wallets"
ON public.wallets FOR SELECT
TO authenticated
USING (public.is_super_admin_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Brokers can view assigned player wallets"
ON public.wallets FOR SELECT
TO authenticated
USING (public.is_broker_of_player(auth.uid(), user_id));

CREATE POLICY "Master admins can update all wallets"
ON public.wallets FOR UPDATE
TO authenticated
USING (public.is_master_super_admin(auth.uid()))
WITH CHECK (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can update tenant wallets"
ON public.wallets FOR UPDATE
TO authenticated
USING (public.is_super_admin_of_tenant(auth.uid(), tenant_id))
WITH CHECK (public.is_super_admin_of_tenant(auth.uid(), tenant_id));

-- WALLET_TRANSACTIONS policies (read only - immutable)
CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (
  wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
);

CREATE POLICY "Master admins can view all transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can view tenant transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (public.is_super_admin_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Brokers can view assigned player transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (
  wallet_id IN (
    SELECT w.id FROM public.wallets w
    WHERE public.is_broker_of_player(auth.uid(), w.user_id)
  )
);

-- AUDIT_LOGS policies (read only - immutable)
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Master admins can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can view tenant audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_super_admin_of_tenant(auth.uid(), tenant_id));

-- CONFIG_VERSIONS policies
CREATE POLICY "Master admins can manage all configs"
ON public.config_versions FOR ALL
TO authenticated
USING (public.is_master_super_admin(auth.uid()))
WITH CHECK (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage tenant configs"
ON public.config_versions FOR ALL
TO authenticated
USING (public.is_super_admin_of_tenant(auth.uid(), tenant_id))
WITH CHECK (public.is_super_admin_of_tenant(auth.uid(), tenant_id));

-- GAME_TABLES policies
CREATE POLICY "Anyone can view active game tables"
ON public.game_tables FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Master admins can manage all game tables"
ON public.game_tables FOR ALL
TO authenticated
USING (public.is_master_super_admin(auth.uid()))
WITH CHECK (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage tenant game tables"
ON public.game_tables FOR ALL
TO authenticated
USING (public.is_super_admin_of_tenant(auth.uid(), tenant_id))
WITH CHECK (public.is_super_admin_of_tenant(auth.uid(), tenant_id));

-- GAME_SESSIONS policies
CREATE POLICY "Users can view sessions they are in"
ON public.game_sessions FOR SELECT
TO authenticated
USING (public.is_player_in_session(auth.uid(), id));

CREATE POLICY "Users can view waiting sessions"
ON public.game_sessions FOR SELECT
TO authenticated
USING (status = 'waiting');

CREATE POLICY "Master admins can manage all sessions"
ON public.game_sessions FOR ALL
TO authenticated
USING (public.is_master_super_admin(auth.uid()))
WITH CHECK (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage tenant sessions"
ON public.game_sessions FOR ALL
TO authenticated
USING (public.is_super_admin_of_tenant(auth.uid(), tenant_id))
WITH CHECK (public.is_super_admin_of_tenant(auth.uid(), tenant_id));

-- GAME_PLAYERS policies
CREATE POLICY "Users can view own game player record"
ON public.game_players FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view players in same session"
ON public.game_players FOR SELECT
TO authenticated
USING (public.is_player_in_session(auth.uid(), game_session_id));

CREATE POLICY "Master admins can manage all game players"
ON public.game_players FOR ALL
TO authenticated
USING (public.is_master_super_admin(auth.uid()))
WITH CHECK (public.is_master_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage tenant game players"
ON public.game_players FOR ALL
TO authenticated
USING (public.is_super_admin_of_tenant(auth.uid(), tenant_id))
WITH CHECK (public.is_super_admin_of_tenant(auth.uid(), tenant_id));

-- =====================================================
-- PHASE 10: TRIGGERS
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_tables_updated_at
  BEFORE UPDATE ON public.game_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  -- Create wallet with zero balance
  INSERT INTO public.wallets (user_id, available, locked, bonus)
  VALUES (NEW.id, 0, 0, 0);
  
  -- Assign default player role (no tenant initially)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'player');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log wallet changes
CREATE OR REPLACE FUNCTION public.log_wallet_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, tenant_id, action, resource_type, resource_id, details)
  VALUES (
    NEW.user_id,
    NEW.tenant_id,
    'wallet_updated',
    'wallet',
    NEW.id,
    jsonb_build_object(
      'old_available', OLD.available,
      'new_available', NEW.available,
      'old_locked', OLD.locked,
      'new_locked', NEW.locked,
      'old_bonus', OLD.bonus,
      'new_bonus', NEW.bonus
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_wallet_change
  AFTER UPDATE ON public.wallets
  FOR EACH ROW
  WHEN (OLD.available != NEW.available OR OLD.locked != NEW.locked OR OLD.bonus != NEW.bonus)
  EXECUTE FUNCTION public.log_wallet_change();

-- =====================================================
-- PHASE 11: STORED PROCEDURES
-- =====================================================

-- Process wallet transaction atomically
CREATE OR REPLACE FUNCTION public.process_wallet_transaction(
  _wallet_id UUID,
  _type public.wallet_tx_type,
  _amount BIGINT,
  _description TEXT DEFAULT NULL,
  _reference_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS public.wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wallet public.wallets;
  _new_balance BIGINT;
  _tx public.wallet_transactions;
BEGIN
  -- Lock the wallet row
  SELECT * INTO _wallet FROM public.wallets WHERE id = _wallet_id FOR UPDATE;
  
  IF _wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- Calculate new balance based on transaction type
  IF _type IN ('deposit', 'win', 'bonus') THEN
    _new_balance := _wallet.available + _amount;
    UPDATE public.wallets SET available = _new_balance WHERE id = _wallet_id;
  ELSIF _type IN ('withdrawal', 'bet', 'rake') THEN
    IF _wallet.available < _amount THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    _new_balance := _wallet.available - _amount;
    UPDATE public.wallets SET available = _new_balance WHERE id = _wallet_id;
  ELSIF _type = 'transfer' THEN
    -- Handle transfer separately
    _new_balance := _wallet.available;
  END IF;
  
  -- Create transaction record
  INSERT INTO public.wallet_transactions (
    wallet_id, tenant_id, type, amount, balance_after, reference_id, description, metadata
  ) VALUES (
    _wallet_id, _wallet.tenant_id, _type, _amount, _new_balance, _reference_id, _description, _metadata
  ) RETURNING * INTO _tx;
  
  RETURN _tx;
END;
$$;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
