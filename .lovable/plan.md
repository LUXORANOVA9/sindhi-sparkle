

# Plan: Build Full Playable Game with Server-Authoritative Engine

## Overview
Replace the mock game with a real multiplayer Sindhi Patta game. A server-side edge function handles all game logic (shuffle, deal, actions, winner determination). The client subscribes to realtime updates and sends actions via the edge function. This ensures fairness -- no game logic runs on the client.

## Architecture

```text
┌─────────┐    HTTP POST     ┌──────────────────┐    UPDATE     ┌─────────────┐
│  Client  │ ──────────────► │  game-engine      │ ───────────► │  Database    │
│  (React) │                 │  (Edge Function)  │              │  game_sessions│
│          │ ◄────────────── │                   │              │  game_players │
│          │   Realtime Sub  └──────────────────┘              └─────────────┘
└─────────┘
```

## Implementation Steps

### Step 1: Database Migration
- Enable realtime on `game_sessions` and `game_players` tables
- Add RLS policy: authenticated users can INSERT into `game_players` (to join a session)
- Add RLS policy: authenticated users can INSERT into `game_sessions` (to create sessions when joining a table)
- Add `phase` column to `game_sessions` (text, default 'waiting') to track dealing/betting/showdown
- Add `current_bet` column to `game_sessions` (bigint, default 0) for the current bet to match
- Add `min_bet` and `max_bet` columns to `game_sessions` from the table config

### Step 2: Edge Function — `game-engine`
**New file: `supabase/functions/game-engine/index.ts`**

Server-authoritative game engine handling all actions:

**Actions:**
- `join` — Add player to session, deduct buy-in from wallet, assign seat
- `start` — When 2+ players ready, shuffle deck (CSPRNG), deal 3 cards each, set blinds, set phase to 'betting'
- `fold` — Mark player as folded, advance turn
- `call` — Deduct chips, add to pot, advance turn
- `raise` — Validate amount, deduct chips, update current bet, advance turn
- `check` — Advance turn (only if no bet to match)
- `show` — Trigger showdown when only 1 player remains or all have acted

**Core logic:**
- Deck creation and shuffle using crypto.getRandomValues() for fairness
- Deal cards stored in `game_players.hand` (JSONB) — only visible to owner via RLS
- Turn advancement: skip folded players, detect round end
- Winner determination using existing `compareHands` / `isTrail` logic (ported to Deno)
- Pot distribution to winner, rake deduction
- Wallet transactions for buy-in, win, and rake via `process_wallet_transaction`

**Security:**
- Verify JWT (auth required)
- Validate caller is the current player for action commands
- All state mutations happen server-side only

### Step 3: Game Hook — `useGameSession`
**New file: `src/hooks/useGameSession.ts`**

Custom hook that:
- Fetches initial game session + players from DB
- Subscribes to realtime changes on `game_sessions` (for pot, phase, current_player_index, round)
- Subscribes to realtime changes on `game_players` (for bets, folds, chips, current status)
- Fetches own hand separately (only own record has hand visible via RLS)
- Provides action methods that call the edge function: `joinGame()`, `fold()`, `call()`, `raise(amount)`, `check()`
- Manages loading/error states
- Maps DB data to the existing `GameState` interface for seamless UI integration

### Step 4: Join Table Flow
**Modify: `src/pages/Lobby.tsx`**
- Replace mock tables with real `game_tables` data from DB
- When "Join" is clicked: check if a waiting session exists for that table, if not create one
- Navigate to `/game/:tableId` with session context

**Modify: `src/components/lobby/TableCard.tsx`**
- Show real player count from active sessions
- Show real table status

### Step 5: Rewrite Game Page with Real Data
**Modify: `src/pages/Game.tsx`**
- Replace all mock state with `useGameSession` hook
- On mount: call `join` action on the edge function
- Map realtime game state to existing `GameState` interface
- Wire betting controls to edge function actions
- Show waiting screen when phase is 'waiting' (waiting for more players)
- Auto-start when minimum players join (via edge function)
- Show showdown results with winner animation
- Handle game end: show results, option to play again

### Step 6: Update Lobby to Fetch Real Tables
**Modify: `src/pages/Lobby.tsx`**
- Fetch `game_tables` from DB instead of `generateMockTables()`
- Count active players per table from `game_sessions` + `game_players`
- Show real-time player counts via realtime subscription

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Create | Migration SQL | Realtime, new columns, RLS for player inserts |
| Create | `supabase/functions/game-engine/index.ts` | Server-authoritative game engine |
| Create | `src/hooks/useGameSession.ts` | Realtime game state + action methods |
| Modify | `src/pages/Game.tsx` | Wire to real backend, remove all mock data |
| Modify | `src/pages/Lobby.tsx` | Fetch real tables from DB |
| Modify | `src/components/lobby/TableCard.tsx` | Real player counts |

## Game Flow

1. Player opens Lobby → sees real tables from DB
2. Clicks "Join" → edge function creates session (if needed) + adds player, deducts buy-in
3. Game page loads → subscribes to realtime, shows waiting state
4. When 2+ players joined → edge function auto-starts: shuffles, deals, posts blinds
5. Current player sees betting controls → actions call edge function
6. Edge function validates, updates DB → realtime pushes to all clients
7. Round ends → showdown → winner gets pot (minus rake) → new round or game over

## Security Notes
- All card shuffling uses server-side CSPRNG (`crypto.getRandomValues`)
- Cards stored in `game_players.hand` — RLS ensures players only see their own hand
- The `game_players_public` view (already exists) lets players see opponents without seeing their cards
- All action validation happens server-side (can't bet more than you have, can't act out of turn)
- Buy-in deducted via `process_wallet_transaction` with proper authorization

