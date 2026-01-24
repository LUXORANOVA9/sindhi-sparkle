
# Multi-Tenant Database Schema Implementation Plan

## Overview

This plan creates the complete database foundation for the **29 Patta Gaming Platform** with a 4-tier hierarchy (Master Super Admin, Super Admin, Broker, Player), virtual wallet economy, full audit logging, config versioning, and strict tenant isolation.

---

## Phase 1: Database Schema Migration

### 1.1 Enums and Base Types

Create role types and status enums for the platform:

```text
+------------------+     +------------------+     +-------------------+
|    app_role      |     | wallet_tx_type   |     |  config_status    |
+------------------+     +------------------+     +-------------------+
| master_super_admin|    | deposit          |     | draft             |
| super_admin      |     | withdrawal       |     | validated         |
| broker           |     | bet              |     | published         |
| player           |     | win              |     +-------------------+
+------------------+     | rake             |
                         | bonus            |
                         | transfer         |
                         +------------------+
```

### 1.2 Core Tables

**Tenants** - Multi-tenant isolation boundary
- `id`, `name`, `slug`, `is_active`, `settings (JSONB)`, `created_at`, `updated_at`

**Profiles** - User profiles linked to auth.users
- `id`, `user_id` (FK to auth.users), `tenant_id` (FK to tenants), `username`, `display_name`, `avatar_url`, `is_active`, `created_at`, `updated_at`

**User Roles** - RBAC (separate from profiles for security)
- `id`, `user_id` (FK to auth.users), `tenant_id` (FK to tenants, nullable for master), `role`, `created_at`
- Unique constraint on (user_id, tenant_id)

**Broker Players** - Broker-to-player assignments
- `id`, `broker_user_id`, `player_user_id`, `tenant_id`, `created_at`

### 1.3 Virtual Wallet System

**Wallets** - Player chip balances
- `id`, `user_id`, `tenant_id`, `available` (default 0), `locked` (default 0), `bonus` (default 0), `created_at`, `updated_at`

**Wallet Transactions** - Immutable ledger
- `id`, `wallet_id`, `tenant_id`, `type` (enum), `amount`, `balance_after`, `reference_id`, `description`, `metadata (JSONB)`, `created_at`
- No UPDATE/DELETE allowed (immutable)

### 1.4 Governance Tables

**Audit Logs** - Immutable action logs
- `id`, `user_id`, `tenant_id`, `action`, `resource_type`, `resource_id`, `details (JSONB)`, `ip_address`, `user_agent`, `created_at`

**Config Versions** - Draft/Validate/Publish workflow
- `id`, `tenant_id`, `name`, `config_type`, `config_data (JSONB)`, `status`, `created_by`, `validated_at`, `validated_by`, `published_at`, `published_by`, `created_at`

### 1.5 Game Tables

**Game Tables** - Table configurations per tenant
- `id`, `tenant_id`, `name`, `room_type` (classic/coldsoul), `min_buy_in`, `max_buy_in`, `small_blind`, `big_blind`, `max_players`, `rake_percentage`, `is_active`, `created_at`, `updated_at`

**Game Sessions** - Active games
- `id`, `tenant_id`, `game_table_id`, `status` (waiting/playing/finished), `pot`, `current_player_index`, `dealer_index`, `round`, `game_state (JSONB)`, `started_at`, `ended_at`, `created_at`, `updated_at`

**Game Players** - Players in sessions
- `id`, `game_session_id`, `user_id`, `tenant_id`, `seat_position`, `chips`, `hand (JSONB)`, `bet`, `has_folded`, `is_current`, `joined_at`

---

## Phase 2: Security Helper Functions

Security definer functions to avoid RLS recursion:

```sql
-- Check if user is Master Super Admin (tenant_id IS NULL)
is_master_super_admin(uid) -> boolean

-- Check if user has Super Admin role for a tenant
is_super_admin_of_tenant(uid, tid) -> boolean

-- Check if user has any role in a tenant
has_tenant_access(uid, tid) -> boolean

-- Check user's role level
get_user_role(uid, tid) -> app_role

-- Check if broker manages a player
is_broker_of_player(broker_uid, player_uid) -> boolean

-- Check if user is in a game session
is_player_in_session(uid, session_id) -> boolean
```

---

## Phase 3: Row Level Security Policies

### Access Matrix Summary

| Table | Master Super Admin | Super Admin | Broker | Player |
|-------|-------------------|-------------|--------|--------|
| tenants | CRUD | R (own) | - | - |
| profiles | R/U | R/U (tenant) | R (assigned) | R/U (self) |
| user_roles | CRUD | CRUD (tenant) | R | R (self) |
| wallets | R/U | R/U (tenant) | R (assigned) | R/U (self) |
| wallet_transactions | R | R (tenant) | R (assigned) | R (self) |
| audit_logs | R | R (tenant) | R (own) | R (own) |
| config_versions | CRUD | CRUD (tenant) | - | - |
| game_tables | CRUD | CRUD (tenant) | R | R |
| game_sessions | R/U | R/U (tenant) | R (assigned) | R/U (own) |
| game_players | R/U | R/U (tenant) | R (assigned) | R/U (self) |
| broker_players | CRUD | CRUD (tenant) | R/U (own) | - |

---

## Phase 4: Triggers and Automation

### 4.1 Automatic Triggers

1. **handle_new_user** - On auth.users INSERT:
   - Create profile in public.profiles
   - Create wallet with zero balances
   - Assign default 'player' role

2. **update_timestamp** - Auto-update `updated_at` on modifications

3. **log_wallet_change** - Create audit log on wallet balance changes

4. **validate_wallet_transaction** - Ensure sufficient balance before bet/withdrawal

### 4.2 Database Functions

1. **process_wallet_transaction** - Atomic wallet operations
2. **validate_config_version** - Transition draft to validated
3. **publish_config_version** - Transition validated to published

---

## Phase 5: Frontend Integration Updates

### 5.1 Authentication System (Auth.tsx)

Update to use real Supabase auth:
- Implement `supabase.auth.signUp()` with email confirmation
- Implement `supabase.auth.signInWithPassword()`
- Add `onAuthStateChange` listener for session management
- Redirect authenticated users to appropriate dashboard based on role

### 5.2 Auth Context

Create `src/contexts/AuthContext.tsx`:
- Session state management
- User profile with role information
- Loading states
- Sign in/out functions

### 5.3 Protected Routes

Create `src/components/ProtectedRoute.tsx`:
- Check authentication status
- Verify role-based access
- Redirect unauthorized users

### 5.4 Role-Based Dashboards

Update routing in `App.tsx`:
- `/admin` - Master Super Admin / Super Admin dashboard
- `/broker` - Broker dashboard (new)
- `/lobby` - Player lobby
- `/wallet` - Player wallet (real data)

---

## Phase 6: Admin Dashboard Updates

### 6.1 Real Data Integration

Update `Admin.tsx` to:
- Fetch real stats from database
- Display actual players list from profiles table
- Show real audit logs
- Implement tenant filtering for Super Admins

### 6.2 User Management

Add functionality for:
- View/manage users within tenant scope
- Assign/remove broker-player relationships
- View wallet balances
- Suspend/activate accounts

### 6.3 Config Management

Create config versioning UI:
- Create draft configurations
- Validate and preview changes
- Publish configurations
- Rollback to previous versions

---

## Phase 7: Wallet System Integration

### 7.1 Real Wallet Data

Update `Wallet.tsx` to:
- Fetch wallet balances from database
- Display real transaction history
- Show available/locked/bonus breakdown

### 7.2 Transaction Operations

Implement (via edge functions for security):
- Deposit chips (admin-initiated)
- Lock chips for game entry
- Process game wins/losses
- Rake collection

---

## Technical Details

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase migration` | CREATE | Full schema with 11 tables |
| `src/contexts/AuthContext.tsx` | CREATE | Auth state management |
| `src/components/ProtectedRoute.tsx` | CREATE | Route protection |
| `src/hooks/useUserRole.ts` | CREATE | Role checking hook |
| `src/pages/Auth.tsx` | UPDATE | Real Supabase auth |
| `src/pages/Admin.tsx` | UPDATE | Real data integration |
| `src/pages/Wallet.tsx` | UPDATE | Real wallet data |
| `src/App.tsx` | UPDATE | Protected routes |

### Migration SQL Size

Approximately 400-500 lines including:
- 11 table definitions
- 6 security definer functions
- 25+ RLS policies
- 4 triggers
- 2 stored procedures

### Security Considerations

1. **Tenant Isolation**: All queries scoped by `tenant_id`
2. **Role Separation**: Roles stored in separate table, not profiles
3. **Immutable Audit**: No UPDATE/DELETE on audit_logs and wallet_transactions
4. **Security Definer**: All role checks use SECURITY DEFINER functions
5. **RLS Everywhere**: Every table has appropriate policies

---

## Implementation Order

1. **Migration**: Create all tables, functions, and policies
2. **Auth Context**: Set up authentication state management
3. **Protected Routes**: Implement role-based routing
4. **Auth Page**: Update to use real Supabase auth
5. **Admin Dashboard**: Connect to real data
6. **Wallet Page**: Connect to real wallet data
7. **Edge Functions**: Create secure transaction handlers

This plan ensures a secure, scalable foundation for the multi-tenant gaming platform with proper tenant isolation, role-based access control, and full audit capabilities.
