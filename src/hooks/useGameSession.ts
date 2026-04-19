import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Card, GameState, Player } from '@/lib/gameLogic';

interface DbPlayer {
  id: string;
  user_id: string;
  seat_position: number;
  chips: number;
  bet: number;
  hand: Card[] | null;
  has_folded: boolean;
  is_current: boolean;
}

interface DbSession {
  id: string;
  game_table_id: string;
  status: string;
  phase: string;
  pot: number;
  round: number;
  dealer_index: number;
  current_player_index: number | null;
  current_bet: number;
  min_bet: number;
  max_bet: number;
  game_state: any;
}

interface UseGameSessionResult {
  loading: boolean;
  error: string | null;
  sessionId: string | null;
  gameState: GameState | null;
  myPlayer: Player | null;
  isMyTurn: boolean;
  fold: () => Promise<void>;
  call: () => Promise<void>;
  raise: (amount: number) => Promise<void>;
  check: () => Promise<void>;
}

async function callEngine(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('game-engine', {
    body: { action, ...payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useGameSession(tableId: string | undefined): UseGameSessionResult {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<DbSession | null>(null);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const joinedRef = useRef(false);

  // Join the table on mount
  useEffect(() => {
    if (!tableId || !user || joinedRef.current) return;
    joinedRef.current = true;
    (async () => {
      try {
        setLoading(true);
        const data = await callEngine('join', { tableId });
        if (data?.sessionId) setSessionId(data.sessionId);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to join table');
      } finally {
        setLoading(false);
      }
    })();
  }, [tableId, user]);

  // Initial fetch + realtime subscriptions once we have a sessionId
  useEffect(() => {
    if (!sessionId || !user) return;
    let cancelled = false;

    const refresh = async () => {
      const [{ data: s }, { data: ps }, { data: mine }] = await Promise.all([
        supabase.from('game_sessions').select('*').eq('id', sessionId).maybeSingle(),
        supabase.from('game_players').select('*').eq('game_session_id', sessionId).order('seat_position'),
        supabase.from('game_players').select('hand').eq('game_session_id', sessionId).eq('user_id', user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      if (s) setSession(s as unknown as DbSession);
      if (ps) setPlayers(ps as unknown as DbPlayer[]);
      if (mine && Array.isArray((mine as any).hand)) setMyHand((mine as any).hand as Card[]);
    };
    refresh();

    const channel = supabase
      .channel(`game-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_players', filter: `game_session_id=eq.${sessionId}` },
        () => refresh(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sessionId, user]);

  const gameState: GameState | null = useMemo(() => {
    if (!session) return null;
    const mappedPlayers: Player[] = players.map((p) => ({
      id: p.user_id,
      name: p.user_id === user?.id ? 'You' : `Player ${p.seat_position + 1}`,
      chips: Number(p.chips),
      hand: (p.user_id === user?.id ? myHand : []) as Card[],
      isCurrent: p.is_current,
      hasFolded: p.has_folded,
      bet: Number(p.bet),
      isDealer: p.seat_position === session.dealer_index,
    }));

    const phase = (session.phase ?? 'waiting') as GameState['phase'];
    const currentIdx = session.current_player_index ?? 0;

    return {
      id: session.id,
      phase,
      players: mappedPlayers,
      pot: Number(session.pot),
      communityCards: [],
      currentPlayerIndex: currentIdx,
      dealerIndex: session.dealer_index,
      minBet: Number(session.min_bet),
      maxBet: Number(session.max_bet),
      round: session.round,
    };
  }, [session, players, myHand, user?.id]);

  const myPlayer = gameState?.players.find((p) => p.id === user?.id) ?? null;
  const isMyTurn = !!myPlayer?.isCurrent;

  const fold = useCallback(async () => { if (sessionId) await callEngine('fold', { sessionId }); }, [sessionId]);
  const call = useCallback(async () => { if (sessionId) await callEngine('call', { sessionId }); }, [sessionId]);
  const check = useCallback(async () => { if (sessionId) await callEngine('check', { sessionId }); }, [sessionId]);
  const raise = useCallback(async (amount: number) => {
    if (sessionId) await callEngine('raise', { sessionId, amount });
  }, [sessionId]);

  return { loading, error, sessionId, gameState, myPlayer, isMyTurn, fold, call, raise, check };
}
