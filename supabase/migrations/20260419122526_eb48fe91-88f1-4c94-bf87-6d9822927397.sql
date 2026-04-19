-- Add new columns to game_sessions
ALTER TABLE public.game_sessions
  ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS current_bet BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_bet BIGINT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS max_bet BIGINT NOT NULL DEFAULT 5000;

-- Allow authenticated users to insert themselves as a player in a session
CREATE POLICY "Users can join sessions as themselves"
ON public.game_players
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update their own player record (for in-game state changes via service role usually, but useful for ready/leave)
CREATE POLICY "Users can update own player record"
ON public.game_players
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to create a new game session for an active table
CREATE POLICY "Authenticated users can create sessions for active tables"
ON public.game_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.game_tables
    WHERE id = game_table_id AND is_active = true
  )
);

-- Allow authenticated users with a private room code to view that table
CREATE POLICY "Anyone can view private table by room code"
ON public.game_tables
FOR SELECT
TO authenticated
USING (
  is_active = true AND room_code IS NOT NULL
);

-- Enable realtime for game_sessions and game_players
ALTER TABLE public.game_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.game_players REPLICA IDENTITY FULL;
ALTER TABLE public.game_tables REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'game_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'game_players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'game_tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_tables;
  END IF;
END $$;