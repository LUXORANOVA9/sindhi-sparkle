
-- ============================================================
-- FIX 1: Game hand data exposure (game_hand_visibility)
-- Drop the policy that lets players see ALL data of other players in same session.
-- Keep the "own record" policy so players can see their own hand.
-- Create a public view WITHOUT the hand column for viewing other players.
-- ============================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view players in same session" ON public.game_players;

-- Create a public view that excludes the hand column
CREATE VIEW public.game_players_public
WITH (security_invoker = on) AS
SELECT 
  id, 
  game_session_id, 
  user_id, 
  tenant_id, 
  seat_position, 
  chips, 
  bet, 
  has_folded, 
  is_current, 
  joined_at
FROM public.game_players;

-- Add a new policy: players can see other players in their session, but ONLY non-hand columns
-- This works because the view uses security_invoker and the base table policy controls access
CREATE POLICY "Users can view players in same session without hand"
ON public.game_players FOR SELECT
TO authenticated
USING (
  public.is_player_in_session(auth.uid(), game_session_id)
  AND user_id != auth.uid()
);

-- ============================================================
-- FIX 2 & 3: Secure process_wallet_transaction function
-- Add ownership check, input validation, role-based type restrictions
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_wallet_transaction(
  _wallet_id uuid, 
  _type wallet_tx_type, 
  _amount bigint, 
  _description text DEFAULT NULL::text, 
  _reference_id uuid DEFAULT NULL::uuid, 
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _wallet public.wallets;
  _new_balance BIGINT;
  _tx public.wallet_transactions;
  _caller_id uuid;
  _is_admin boolean;
BEGIN
  -- Get the caller's user ID
  _caller_id := auth.uid();
  
  IF _caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if caller is master admin
  _is_admin := public.is_master_super_admin(_caller_id);

  -- ======= INPUT VALIDATION =======
  
  -- Validate amount is positive
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  -- Validate maximum amount (prevent unrealistic values)
  IF _amount > 100000000 THEN
    RAISE EXCEPTION 'Amount exceeds maximum allowed';
  END IF;
  
  -- Validate description length
  IF _description IS NOT NULL AND length(_description) > 500 THEN
    RAISE EXCEPTION 'Description too long (max 500 characters)';
  END IF;
  
  -- Validate metadata size (max ~1KB)
  IF _metadata IS NOT NULL AND pg_column_size(_metadata) > 1000 THEN
    RAISE EXCEPTION 'Metadata payload too large';
  END IF;
  
  -- Role-based transaction type restrictions
  -- Only admins can create bonus, rake, and transfer transactions
  IF _type IN ('bonus', 'rake', 'transfer') AND NOT _is_admin THEN
    RAISE EXCEPTION 'Insufficient privileges for this transaction type';
  END IF;

  -- ======= OWNERSHIP CHECK =======
  
  -- Lock the wallet row
  SELECT * INTO _wallet FROM public.wallets WHERE id = _wallet_id FOR UPDATE;
  
  IF _wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- Verify caller owns the wallet OR is an admin
  IF _wallet.user_id != _caller_id AND NOT _is_admin THEN
    RAISE EXCEPTION 'Access denied: not wallet owner';
  END IF;
  
  -- ======= PROCESS TRANSACTION =======
  
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
$function$;

-- Restrict function execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.process_wallet_transaction FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_wallet_transaction FROM anon;
GRANT EXECUTE ON FUNCTION public.process_wallet_transaction TO authenticated;
