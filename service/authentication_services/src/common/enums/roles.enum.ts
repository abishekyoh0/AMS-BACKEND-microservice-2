export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',                         // Overall / Reach admin
  ADMIN_MAINTENANCE = 'admin_maintenance', // Created by ADMIN
  ADMIN_SECURITY = 'admin_security',       // Created by ADMIN
  ADMIN_ACCOUNT = 'admin_account',         // Created by ADMIN
  GATEKEEPER = 'gatekeeper',              // Created by ADMIN_SECURITY
  ACCOUNTANT = 'accountant',              // Created by ADMIN_ACCOUNT
  RESIDENT = 'resident',                  // Created by ADMIN
}

/** Who can create which role */
export const ROLE_CREATION_POLICY: Record<Role, Role[]> = {
  [Role.SUPER_ADMIN]:       [Role.ADMIN],
  [Role.ADMIN]:             [Role.ADMIN_MAINTENANCE, Role.ADMIN_SECURITY, Role.ADMIN_ACCOUNT, Role.RESIDENT],
  [Role.ADMIN_MAINTENANCE]: [],   // creates Workers (no-login records, not Users)
  [Role.ADMIN_SECURITY]:    [Role.GATEKEEPER],
  [Role.ADMIN_ACCOUNT]:     [Role.ACCOUNTANT],
  [Role.GATEKEEPER]:        [],
  [Role.ACCOUNTANT]:        [],
  [Role.RESIDENT]:          [],
};

/** Roles that need gate selection on login */
export const GATE_LOGIN_ROLES: Role[] = [Role.GATEKEEPER];
