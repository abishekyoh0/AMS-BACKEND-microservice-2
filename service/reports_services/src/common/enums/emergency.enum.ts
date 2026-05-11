export enum EmergencyEvent {
  CREATED    = 'emergency.created',
  RESOLVED   = 'emergency.resolved',
  ESCALATED  = 'emergency.escalated',
  ACKNOWLEDGED = 'emergency.acknowledged',
  REPORT_REQUESTED = 'emergency.report.requested',
  REPORT_DONE      = 'emergency.report.done',
  REPORT_FAILED    = 'emergency.report.failed',
}