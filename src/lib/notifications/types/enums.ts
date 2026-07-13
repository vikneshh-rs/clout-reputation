export enum NotificationChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH'
}

export enum NotificationProvider {
  META = 'META'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum NotificationType {
  NEGATIVE_FEEDBACK = 'NEGATIVE_FEEDBACK',
  CALLBACK_REQUEST = 'CALLBACK_REQUEST',
  DAILY_SUMMARY = 'DAILY_SUMMARY',
  WEEKLY_SUMMARY = 'WEEKLY_SUMMARY',
  MONTHLY_SUMMARY = 'MONTHLY_SUMMARY'
}
