// ─── Complaint Type ───────────────────────────────────────────────────────────
export enum ComplaintType {
  COMMON     = 'common',      // Common area issue (lift, garden, corridor, etc.)
  INDIVIDUAL = 'individual',  // Inside a specific flat
}

// ─── Common Area Categories ───────────────────────────────────────────────────
export enum CommonCategory {
  PLUMBING     = 'Plumbing',
  ELECTRICAL   = 'Electrical',
  GARDENING    = 'Gardening',
  LIFT         = 'Lift',
  PAINTING     = 'Painting',
  CLEANING     = 'Cleaning',
  SECURITY     = 'Security',
  CARPENTRY    = 'Carpentry',
  OTHER        = 'Other',
}

// ─── Individual (Flat) Categories ────────────────────────────────────────────
export enum IndividualCategory {
  PLUMBING   = 'Plumbing',
  ELECTRICAL = 'Electrical',
  CARPENTRY  = 'Carpentry',
  PAINTING   = 'Painting',
  PEST       = 'Pest Control',
  APPLIANCE  = 'Appliance Repair',
  OTHER      = 'Other',
}

// ─── Priority ─────────────────────────────────────────────────────────────────
export enum Priority {
  LOW    = 'Low',
  MEDIUM = 'Medium',
  HIGH   = 'High',
}

// ─── Complaint Status (full ticket lifecycle) ─────────────────────────────────
export enum ComplaintStatus {
  OPEN        = 'Open',        // Just raised, not yet assigned
  ASSIGNED    = 'Assigned',    // Worker assigned by admin_maintenance
  ACCEPTED    = 'Accepted',    // Worker accepted the job
  REJECTED    = 'Rejected',    // Worker rejected (will be re-assigned)
  IN_PROGRESS = 'In Progress', // Worker started work
  RESOLVED    = 'Resolved',    // Worker marked complete
  CLOSED      = 'Closed',      // Resident/admin confirmed and closed
}

// ─── Assignment Status ────────────────────────────────────────────────────────
export enum AssignmentStatus {
  ASSIGNED    = 'Assigned',
  ACCEPTED    = 'Accepted',
  REJECTED    = 'Rejected',
  IN_PROGRESS = 'In Progress',
  RESOLVED    = 'Resolved',
}

// ─── Who raised the complaint ─────────────────────────────────────────────────
export enum RaisedByRole {
  RESIDENT             = 'resident',
  ADMIN_MAINTENANCE    = 'admin_maintenance',
}
