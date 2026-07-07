export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: any;
}

export interface NotificationProviderInstance {
  send(recipient: string, message: string): Promise<SendResult>;
}
