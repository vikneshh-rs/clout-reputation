import { NotificationChannel } from './enums';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
    raw?: any;
  };
}

export type NotificationMessageType = 'text' | 'template' | 'interactive';

export interface MessageParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video' | 'payload';
  text?: string;
  payload?: string;
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename?: string;
  };
  video?: {
    link: string;
  };
}

export interface MessageComponent {
  type: 'header' | 'body' | 'button';
  index?: string; // used for button index e.g. "0", "1"
  sub_type?: 'quick_reply' | 'url';
  parameters: MessageParameter[];
}

export interface NotificationMessage {
  recipient: string; // Destination (e.g. phone number in E.164 format)
  type: NotificationMessageType;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    languageCode: string;
    components?: MessageComponent[];
  };
}

export interface NotificationProviderInterface {
  sendText(message: NotificationMessage): Promise<SendResult>;
  sendText(to: string, text: string): Promise<SendResult>;
  
  sendTemplate(message: NotificationMessage): Promise<SendResult>;
  sendTemplate(to: string, templateName: string, languageCode: string, components?: MessageComponent[]): Promise<SendResult>;
  
  sendInteractiveTemplate(message: NotificationMessage): Promise<SendResult>;
  sendInteractiveTemplate(to: string, templateName: string, languageCode: string, components?: MessageComponent[]): Promise<SendResult>;

  health(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }>;
}

import { Review, Business } from '@prisma/client';

export interface NegativeFeedbackTemplate {
  review: Review;
  business: Business;
}

export interface CallbackRequestTemplate {
  review: Review;
  business: Business;
}

export interface WeeklySummaryTemplate {
  business: Business;
  positiveReviews: number;
  negativeReviews: number;
  callbackRequests: number;
}

export interface MonthlySummaryTemplate {
  business: Business;
  positiveReviews: number;
  negativeReviews: number;
  callbackRequests: number;
}

export interface GoogleReplyReminderTemplate {
  business: Business;
}
