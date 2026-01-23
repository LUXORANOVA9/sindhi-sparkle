// Sindhi Patta (29 Cards) Game Logic

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  chips: number;
  hand: Card[];
  isCurrent: boolean;
  hasFolded: boolean;
  bet: number;
  isDealer?: boolean;
}

export interface GameState {
  id: string;
  phase: 'waiting' | 'dealing' | 'betting' | 'showdown' | 'festival';
  players: Player[];
  pot: number;
  communityCards: Card[];
  currentPlayerIndex: number;
  dealerIndex: number;
  minBet: number;
  maxBet: number;
  round: number;
}

export interface Table {
  id: string;
  name: string;
  roomType: 'classic' | 'coldsoul';
  minBuyIn: number;
  maxBuyIn: number;
  blinds: { small: number; big: number };
  maxPlayers: number;
  currentPlayers: number;
  status: 'waiting' | 'playing' | 'full';
}

// 29-card deck: 2-8 for all suits + 9 of Hearts (highest card)
export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8'];
  const deck: Card[] = [];

  // Add 2-8 for all suits
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({
        suit,
        rank,
        id: `${rank}_${suit}`
      });
    });
  });

  // Add 9 of Hearts (the highest card)
  deck.push({
    suit: 'hearts',
    rank: '9',
    id: '9_hearts'
  });

  return deck;
}

// Fisher-Yates shuffle (cryptographically would use CSPRNG on server)
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Card value for comparison (9 of Hearts is highest)
export function getCardValue(card: Card): number {
  if (card.rank === '9' && card.suit === 'hearts') {
    return 100; // Highest card
  }
  return parseInt(card.rank);
}

// Check for Trail (three of a kind)
export function isTrail(cards: Card[]): boolean {
  if (cards.length !== 3) return false;
  return cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
}

// Get trail value (for comparison)
export function getTrailValue(cards: Card[]): number {
  if (!isTrail(cards)) return 0;
  return parseInt(cards[0].rank) * 1000; // Multiply to ensure trails beat singles
}

// Check if hand contains 9 of Hearts (9 Completion Rule)
export function hasNineOfHearts(cards: Card[]): boolean {
  return cards.some(card => card.rank === '9' && card.suit === 'hearts');
}

// Compare two hands
export function compareHands(hand1: Card[], hand2: Card[]): number {
  // Trail beats everything except higher trail
  const trail1 = isTrail(hand1);
  const trail2 = isTrail(hand2);
  
  if (trail1 && trail2) {
    return getTrailValue(hand1) - getTrailValue(hand2);
  }
  if (trail1) return 1;
  if (trail2) return -1;
  
  // High card comparison (9 of Hearts is highest)
  const max1 = Math.max(...hand1.map(getCardValue));
  const max2 = Math.max(...hand2.map(getCardValue));
  
  return max1 - max2;
}

// Deal cards to players
export function dealCards(deck: Card[], numPlayers: number, cardsPerPlayer: number = 3): Card[][] {
  const hands: Card[][] = [];
  let cardIndex = 0;
  
  for (let i = 0; i < numPlayers; i++) {
    const hand: Card[] = [];
    for (let j = 0; j < cardsPerPlayer; j++) {
      if (cardIndex < deck.length) {
        hand.push(deck[cardIndex]);
        cardIndex++;
      }
    }
    hands.push(hand);
  }
  
  return hands;
}

// Get suit symbol
export function getSuitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return symbols[suit];
}

// Check if suit is red
export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

// Format chip value
export function formatChips(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

// Generate mock tables
export function generateMockTables(): Table[] {
  return [
    {
      id: 'table-1',
      name: 'Beginner\'s Fortune',
      roomType: 'classic',
      minBuyIn: 100,
      maxBuyIn: 1000,
      blinds: { small: 5, big: 10 },
      maxPlayers: 6,
      currentPlayers: 3,
      status: 'waiting'
    },
    {
      id: 'table-2',
      name: 'High Rollers',
      roomType: 'classic',
      minBuyIn: 5000,
      maxBuyIn: 50000,
      blinds: { small: 100, big: 200 },
      maxPlayers: 6,
      currentPlayers: 5,
      status: 'playing'
    },
    {
      id: 'table-3',
      name: 'Cold Soul Arena',
      roomType: 'coldsoul',
      minBuyIn: 1000,
      maxBuyIn: 10000,
      blinds: { small: 25, big: 50 },
      maxPlayers: 4,
      currentPlayers: 4,
      status: 'full'
    },
    {
      id: 'table-4',
      name: 'Festival Special',
      roomType: 'classic',
      minBuyIn: 500,
      maxBuyIn: 5000,
      blinds: { small: 10, big: 20 },
      maxPlayers: 8,
      currentPlayers: 2,
      status: 'waiting'
    },
    {
      id: 'table-5',
      name: 'Midnight Stakes',
      roomType: 'coldsoul',
      minBuyIn: 2500,
      maxBuyIn: 25000,
      blinds: { small: 50, big: 100 },
      maxPlayers: 4,
      currentPlayers: 1,
      status: 'waiting'
    }
  ];
}

// Generate mock player
export function generateMockPlayer(id: string, name: string, chips: number = 10000): Player {
  return {
    id,
    name,
    chips,
    hand: [],
    isCurrent: false,
    hasFolded: false,
    bet: 0
  };
}
