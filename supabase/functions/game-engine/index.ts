// Server-authoritative Sindhi Patta game engine
// All shuffling, dealing, and action validation happens here.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
interface Card { suit: Suit; rank: Rank; id: string }

function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9'];
  const deck: Card[] = [];
  for (const s of suits) for (const r of ranks) deck.push({ suit: s, rank: r, id: `${r}_${s}` });
  return deck;
}

// CSPRNG Fisher-Yates shuffle
function secureShuffle(deck: Card[]): Card[] {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const rand = new Uint32Array(1);
    crypto.getRandomValues(rand);
    const j = rand[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardValue(c: Card): number {
  if (c.rank === '9' && c.suit === 'hearts') return 100;
  return parseInt(c.rank);
}
function isTrail(cards: Card[]): boolean {
  return cards.length === 3 && cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
}
function compareHands(h1: Card[], h2: Card[]): number {
  const t1 = isTrail(h1), t2 = isTrail(h2);
  if (t1 && t2) return parseInt(h1[0].rank) - parseInt(h2[0].rank);
  if (t1) return 1;
  if (t2) return -1;
  return Math.max(...h1.map(cardValue)) - Math.max(...h2.map(cardValue));
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;

    // Auth client (verifies JWT)
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // Service-role admin client for trusted writes
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;
    const tableId = body?.tableId as string | undefined;
    const sessionId = body?.sessionId as string | undefined;
    const amount = Number(body?.amount ?? 0);

    if (!action) return jsonResponse({ error: 'Missing action' }, 400);

    // ================= JOIN =================
    if (action === 'join') {
      if (!tableId) return jsonResponse({ error: 'Missing tableId' }, 400);

      const { data: table, error: tableErr } = await admin
        .from('game_tables').select('*').eq('id', tableId).maybeSingle();
      if (tableErr || !table) return jsonResponse({ error: 'Table not found' }, 404);
      if (!table.is_active) return jsonResponse({ error: 'Table inactive' }, 400);

      // Find or create a waiting session for this table
      let session: any;
      const { data: existing } = await admin
        .from('game_sessions')
        .select('*')
        .eq('game_table_id', tableId)
        .in('status', ['waiting', 'playing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        session = existing;
      } else {
        const { data: newSession, error: sErr } = await admin
          .from('game_sessions')
          .insert({
            game_table_id: tableId,
            tenant_id: table.tenant_id,
            status: 'waiting',
            phase: 'waiting',
            pot: 0,
            round: 0,
            dealer_index: 0,
            min_bet: table.small_blind,
            max_bet: table.max_buy_in,
            current_bet: 0,
          })
          .select()
          .single();
        if (sErr || !newSession) return jsonResponse({ error: 'Could not create session', detail: sErr?.message }, 500);
        session = newSession;
      }

      // Already in this session?
      const { data: existingPlayer } = await admin
        .from('game_players').select('*').eq('game_session_id', session.id).eq('user_id', userId).maybeSingle();

      if (existingPlayer) {
        return jsonResponse({ sessionId: session.id, alreadyJoined: true });
      }

      // Capacity check
      const { count: playerCount } = await admin
        .from('game_players').select('*', { count: 'exact', head: true }).eq('game_session_id', session.id);
      if ((playerCount ?? 0) >= table.max_players) {
        return jsonResponse({ error: 'Session full' }, 400);
      }

      // Find next seat
      const { data: seated } = await admin
        .from('game_players').select('seat_position').eq('game_session_id', session.id);
      const taken = new Set((seated ?? []).map((s: any) => s.seat_position));
      let seat = 0;
      for (let i = 0; i < table.max_players; i++) if (!taken.has(i)) { seat = i; break; }

      // Deduct buy-in from wallet (use min_buy_in)
      const buyIn = Number(table.min_buy_in ?? 1000);
      const { data: wallet } = await admin
        .from('wallets').select('*').eq('user_id', userId).maybeSingle();
      if (!wallet) return jsonResponse({ error: 'Wallet not found' }, 400);
      if (Number(wallet.available) < buyIn) {
        return jsonResponse({ error: 'Insufficient balance for buy-in' }, 400);
      }
      const newAvailable = Number(wallet.available) - buyIn;
      await admin.from('wallets').update({ available: newAvailable }).eq('id', wallet.id);
      await admin.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        tenant_id: wallet.tenant_id,
        type: 'bet',
        amount: buyIn,
        balance_after: newAvailable,
        description: `Buy-in for table ${table.name}`,
      });

      // Insert player
      await admin.from('game_players').insert({
        game_session_id: session.id,
        tenant_id: table.tenant_id,
        user_id: userId,
        seat_position: seat,
        chips: buyIn,
        bet: 0,
        hand: [],
        has_folded: false,
        is_current: false,
      });

      // Auto-start if 2+ players and still waiting
      const { data: allPlayers } = await admin
        .from('game_players').select('*').eq('game_session_id', session.id).order('seat_position');
      if ((allPlayers?.length ?? 0) >= 2 && session.status === 'waiting') {
        await startRound(admin, session.id, table, allPlayers!);
      }

      return jsonResponse({ sessionId: session.id });
    }

    // For all other actions we need a sessionId
    if (!sessionId) return jsonResponse({ error: 'Missing sessionId' }, 400);

    const { data: session, error: sErr } = await admin
      .from('game_sessions').select('*').eq('id', sessionId).maybeSingle();
    if (sErr || !session) return jsonResponse({ error: 'Session not found' }, 404);

    const { data: players } = await admin
      .from('game_players').select('*').eq('game_session_id', sessionId).order('seat_position');
    const playersList: any[] = players ?? [];
    const me = playersList.find((p) => p.user_id === userId);
    if (!me) return jsonResponse({ error: 'Not in this session' }, 403);

    // ================= START (manual) =================
    if (action === 'start') {
      const { data: table } = await admin
        .from('game_tables').select('*').eq('id', session.game_table_id).single();
      if (playersList.length < 2) return jsonResponse({ error: 'Need at least 2 players' }, 400);
      await startRound(admin, sessionId, table, playersList);
      return jsonResponse({ ok: true });
    }

    // Action validations: must be active session in betting phase, your turn, not folded
    if (session.status !== 'playing' || session.phase !== 'betting') {
      return jsonResponse({ error: 'No active betting round' }, 400);
    }
    if (me.has_folded) return jsonResponse({ error: 'You folded' }, 400);
    const currentPlayer = playersList[session.current_player_index];
    if (!currentPlayer || currentPlayer.user_id !== userId) {
      return jsonResponse({ error: 'Not your turn' }, 400);
    }

    const currentBet = Number(session.current_bet ?? 0);

    if (action === 'fold') {
      await admin.from('game_players').update({ has_folded: true, is_current: false }).eq('id', me.id);
      await advanceTurn(admin, sessionId);
      return jsonResponse({ ok: true });
    }

    if (action === 'check') {
      if (currentBet > Number(me.bet)) return jsonResponse({ error: 'Cannot check; bet is on' }, 400);
      await admin.from('game_players').update({ is_current: false }).eq('id', me.id);
      await advanceTurn(admin, sessionId);
      return jsonResponse({ ok: true });
    }

    if (action === 'call') {
      const toCall = Math.max(0, currentBet - Number(me.bet));
      if (toCall > Number(me.chips)) return jsonResponse({ error: 'Insufficient chips' }, 400);
      await admin.from('game_players').update({
        chips: Number(me.chips) - toCall,
        bet: Number(me.bet) + toCall,
        is_current: false,
      }).eq('id', me.id);
      await admin.from('game_sessions').update({ pot: Number(session.pot) + toCall }).eq('id', sessionId);
      await advanceTurn(admin, sessionId);
      return jsonResponse({ ok: true });
    }

    if (action === 'raise') {
      if (!Number.isFinite(amount) || amount <= 0) return jsonResponse({ error: 'Invalid raise amount' }, 400);
      const newBet = Number(me.bet) + amount;
      if (newBet <= currentBet) return jsonResponse({ error: 'Raise must exceed current bet' }, 400);
      if (amount > Number(me.chips)) return jsonResponse({ error: 'Insufficient chips' }, 400);
      if (amount > Number(session.max_bet)) return jsonResponse({ error: 'Above max bet' }, 400);
      await admin.from('game_players').update({
        chips: Number(me.chips) - amount,
        bet: newBet,
        is_current: false,
      }).eq('id', me.id);
      await admin.from('game_sessions').update({
        pot: Number(session.pot) + amount,
        current_bet: newBet,
      }).eq('id', sessionId);
      await advanceTurn(admin, sessionId);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error('game-engine error', e);
    return jsonResponse({ error: 'Internal error', detail: String((e as Error).message) }, 500);
  }
});

// ============== Helpers ==============
async function startRound(admin: any, sessionId: string, table: any, players: any[]) {
  // Shuffle and deal
  const deck = secureShuffle(createDeck());
  const sorted = [...players].sort((a, b) => a.seat_position - b.seat_position);
  const hands: Record<string, Card[]> = {};
  let idx = 0;
  for (const p of sorted) hands[p.id] = [];
  for (let c = 0; c < 3; c++) {
    for (const p of sorted) {
      hands[p.id].push(deck[idx++]);
    }
  }

  // Reset player state and assign hands
  for (const p of sorted) {
    await admin.from('game_players').update({
      hand: hands[p.id],
      bet: 0,
      has_folded: false,
      is_current: false,
    }).eq('id', p.id);
  }

  const dealerIndex = 0;
  const firstToAct = sorted.length > 1 ? 1 : 0;
  await admin.from('game_players').update({ is_current: true }).eq('id', sorted[firstToAct].id);

  await admin.from('game_sessions').update({
    status: 'playing',
    phase: 'betting',
    pot: 0,
    current_bet: Number(table.small_blind ?? 0),
    round: 1,
    dealer_index: dealerIndex,
    current_player_index: firstToAct,
    started_at: new Date().toISOString(),
  }).eq('id', sessionId);
}

async function advanceTurn(admin: any, sessionId: string) {
  const { data: session } = await admin.from('game_sessions').select('*').eq('id', sessionId).single();
  const { data: players } = await admin
    .from('game_players').select('*').eq('game_session_id', sessionId).order('seat_position');
  const list: any[] = players ?? [];

  const active = list.filter((p) => !p.has_folded);

  // Only one player left → showdown, they win the pot
  if (active.length <= 1) {
    return finishRound(admin, sessionId, session, list, active);
  }

  // All active players have matched current_bet → showdown
  const currentBet = Number(session.current_bet ?? 0);
  const allMatched = active.every((p) => Number(p.bet) === currentBet);
  if (allMatched && currentBet > 0) {
    return finishRound(admin, sessionId, session, list, active);
  }

  // Otherwise advance to next non-folded player
  let next = (Number(session.current_player_index ?? 0) + 1) % list.length;
  let safety = 0;
  while (list[next].has_folded && safety++ < list.length) {
    next = (next + 1) % list.length;
  }
  await admin.from('game_players').update({ is_current: true }).eq('id', list[next].id);
  await admin.from('game_sessions').update({ current_player_index: next }).eq('id', sessionId);
}

async function finishRound(admin: any, sessionId: string, session: any, allPlayers: any[], active: any[]) {
  let winner: any = null;
  if (active.length === 1) {
    winner = active[0];
  } else {
    // Compare hands
    let best = active[0];
    for (let i = 1; i < active.length; i++) {
      if (compareHands(active[i].hand as Card[], best.hand as Card[]) > 0) best = active[i];
    }
    winner = best;
  }

  const { data: table } = await admin
    .from('game_tables').select('*').eq('id', session.game_table_id).single();
  const rakePct = Number(table?.rake_percentage ?? 0);
  const pot = Number(session.pot ?? 0);
  const rake = Math.floor((pot * rakePct) / 100);
  const payout = pot - rake;

  // Credit winner's chips at the table
  await admin.from('game_players').update({
    chips: Number(winner.chips) + payout,
    is_current: false,
  }).eq('id', winner.id);

  // Mark all not current
  await admin.from('game_players').update({ is_current: false }).eq('game_session_id', sessionId).neq('id', winner.id);

  await admin.from('game_sessions').update({
    phase: 'showdown',
    status: 'waiting',
    pot: 0,
    current_bet: 0,
    current_player_index: null,
    ended_at: new Date().toISOString(),
    game_state: { lastWinnerUserId: winner.user_id, lastPayout: payout, lastRake: rake },
  }).eq('id', sessionId);
}
