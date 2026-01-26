
# Plan: Connect Wallet Page to Real Database

## Overview
Update the Wallet page to display the user's real wallet balance and transaction history from the database, replacing the current mock data with live data fetched via Supabase.

## Current State
- The Wallet page (`src/pages/Wallet.tsx`) uses hardcoded mock data for user info, balance, and transactions
- The `AuthContext` already fetches the user's wallet data and stores it in context
- The database has `wallets` and `wallet_transactions` tables with proper RLS policies
- Transaction types in the database: `deposit`, `withdrawal`, `bet`, `win`, `rake`, `bonus`, `transfer`

## Implementation Steps

### Step 1: Create Wallet Data Hook
Create a new hook `src/hooks/useWalletData.ts` that:
- Fetches the user's wallet using the existing AuthContext wallet data
- Fetches transaction history from `wallet_transactions` table for the user's wallet
- Calculates today's change by summing transactions from the last 24 hours
- Calculates total wins and total losses from transaction history
- Calculates weekly stats (games played, win rate, net profit)

### Step 2: Update Wallet Page
Modify `src/pages/Wallet.tsx` to:
- Import and use the `useAuth` hook to get user info, profile, and wallet
- Import the new `useWalletData` hook for transactions and stats
- Replace `mockUser` with real data from AuthContext (profile name, wallet balance, role)
- Replace `mockTransactions` with real transaction data
- Update Header to use real user data including logout functionality
- Handle loading and empty states appropriately
- Pass real onDeposit/onWithdraw handlers (can show toast for now since no UI for these yet)

### Step 3: Update TransactionItem Component
Modify `src/components/wallet/WalletCard.tsx` to:
- Update the `TransactionProps` interface to match database transaction types
- Map database transaction types (`bet`, `rake`, `bonus`, `transfer`) to display appropriately
- Handle the fact that database transactions don't have a `status` field - all are "completed"
- Add support for the additional transaction types from the enum

### Step 4: Update Sidebar Statistics
- Calculate pending withdrawals from transactions (if metadata contains pending status)
- Calculate "This Week" stats from transaction data:
  - Games Played: count unique game sessions from `bet` transactions
  - Win Rate: wins / (wins + losses)
  - Net Profit: sum of wins - sum of losses/rake

## Technical Details

### Database Transaction Type Mapping
```text
Database Type    ->    Display Type
-----------------------------------------
deposit               deposit
withdrawal            withdrawal
bet                   loss (debit)
win                   win
rake                  commission
bonus                 deposit (credit)
transfer              varies by amount sign
```

### Transaction Query
```sql
SELECT * FROM wallet_transactions 
WHERE wallet_id = :user_wallet_id 
ORDER BY created_at DESC 
LIMIT 50
```

### Today's Change Calculation
Sum all transactions from the last 24 hours where:
- Credits (deposit, win, bonus): add amount
- Debits (withdrawal, bet, rake): subtract amount

## Files to Create/Modify
1. **Create** `src/hooks/useWalletData.ts` - New hook for wallet transactions and stats
2. **Modify** `src/pages/Wallet.tsx` - Replace mock data with real data
3. **Modify** `src/components/wallet/WalletCard.tsx` - Update transaction types

## User Experience
- Loading skeleton while data is fetching
- Empty state if no transactions exist
- Real-time balance display from user's wallet
- Transaction history with proper filtering by type
- Accurate win/loss statistics calculated from actual transactions
