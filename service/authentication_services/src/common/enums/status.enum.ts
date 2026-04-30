export enum UserStatus {
  PENDING   = 'pending',
  ACTIVE    = 'active',
  INACTIVE  = 'inactive',
  SUSPENDED = 'suspended',
}

export enum ResidentType {
  OWNER  = 'owner',
  TENANT = 'tenant',
}

export enum GateStatus {
  ACTIVE      = 'active',
  INACTIVE    = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum ShiftDay {
  MONDAY    = 'monday',
  TUESDAY   = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY  = 'thursday',
  FRIDAY    = 'friday',
  SATURDAY  = 'saturday',
  SUNDAY    = 'sunday',
}

export enum SessionStatus {
  ACTIVE = 'active',
  ENDED  = 'ended',
}

export enum WorkerStatus {
  ACTIVE   = 'active',
  INACTIVE = 'inactive',
}
