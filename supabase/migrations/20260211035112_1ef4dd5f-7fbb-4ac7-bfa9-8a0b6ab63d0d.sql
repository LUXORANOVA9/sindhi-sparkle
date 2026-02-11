
-- Add private room support columns to game_tables
ALTER TABLE public.game_tables
  ADD COLUMN IF NOT EXISTS room_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Create index on room_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_game_tables_room_code ON public.game_tables (room_code) WHERE room_code IS NOT NULL;

-- Allow authenticated users to create private rooms
CREATE POLICY "Authenticated users can create private rooms"
  ON public.game_tables
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND is_private = true AND created_by = auth.uid());

-- Update the existing SELECT policy to also show private tables to their creator
CREATE POLICY "Creators can view their private tables"
  ON public.game_tables
  FOR SELECT
  USING (is_private = true AND created_by = auth.uid());

-- Allow creators to update their own private tables
CREATE POLICY "Creators can update their private tables"
  ON public.game_tables
  FOR UPDATE
  USING (is_private = true AND created_by = auth.uid())
  WITH CHECK (is_private = true AND created_by = auth.uid());

-- Function to lookup table by room code (security definer so it works for any authenticated user)
CREATE OR REPLACE FUNCTION public.lookup_table_by_code(_room_code TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.game_tables
  WHERE room_code = _room_code
    AND is_active = true
    AND is_private = true
$$;
