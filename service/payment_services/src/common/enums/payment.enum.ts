export enum PaymentMode {
  UPI          = 'UPI',
  CASH         = 'Cash',
  CHEQUE       = 'Cheque',
  BANK_TRANSFER = 'Bank Transfer',
}

export enum BillStatus {
  PENDING  = 'Pending',  // Generated, not paid
  PAID     = 'Paid',     // Fully paid
  PARTIAL  = 'Partial',  // Partially paid
  OVERDUE  = 'Overdue',  // Past due date, not fully paid
}

export enum PaymentStatus {
  PENDING  = 'Pending',   // Submitted, awaiting accountant verification
  VERIFIED = 'Verified',  // Accountant confirmed payment received
  REJECTED = 'Rejected',  // Accountant rejected (wrong amount, fake proof, etc.)
}

export enum ReminderType {
  DUE     = 'Due',     // Bill due soon
  OVERDUE = 'Overdue', // Bill past due date
}
