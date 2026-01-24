import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'master_super_admin' | 'super_admin' | 'broker' | 'player';

export function useUserRole() {
  const { roles, isMasterAdmin, isSuperAdmin, isBroker, getHighestRole, profile } = useAuth();

  const isAdmin = (): boolean => {
    return isMasterAdmin() || isSuperAdmin();
  };

  const canManageUsers = (): boolean => {
    return isAdmin();
  };

  const canManageTenants = (): boolean => {
    return isMasterAdmin();
  };

  const canViewWallets = (userId?: string): boolean => {
    if (isAdmin()) return true;
    if (isBroker()) return true; // Brokers can view assigned players
    return false;
  };

  const canModifyWallets = (): boolean => {
    return isAdmin();
  };

  const canManageGameTables = (): boolean => {
    return isAdmin();
  };

  const canViewAuditLogs = (): boolean => {
    return isAdmin();
  };

  const canManageConfigs = (): boolean => {
    return isAdmin();
  };

  const getCurrentTenantId = (): string | null => {
    return profile?.tenant_id ?? null;
  };

  const getRoleDisplayName = (role: AppRole): string => {
    const displayNames: Record<AppRole, string> = {
      master_super_admin: 'Master Admin',
      super_admin: 'Super Admin',
      broker: 'Broker',
      player: 'Player',
    };
    return displayNames[role];
  };

  const getHighestRoleDisplayName = (): string => {
    const role = getHighestRole();
    return role ? getRoleDisplayName(role) : 'Guest';
  };

  return {
    roles,
    isMasterAdmin,
    isSuperAdmin,
    isBroker,
    isAdmin,
    getHighestRole,
    canManageUsers,
    canManageTenants,
    canViewWallets,
    canModifyWallets,
    canManageGameTables,
    canViewAuditLogs,
    canManageConfigs,
    getCurrentTenantId,
    getRoleDisplayName,
    getHighestRoleDisplayName,
  };
}
