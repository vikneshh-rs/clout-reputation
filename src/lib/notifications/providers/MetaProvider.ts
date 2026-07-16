import { META_CONFIG } from '../config';
import {
  NotificationMessage,
  SendResult,
  NotificationProviderInterface,
  MessageComponent,
} from '../types/interfaces';

export class MetaProvider implements NotificationProviderInterface {
  private apiVersion = 'v18.0';
  private baseUrl = 'https://graph.facebook.com';
  private requestTimeoutMs = 10000; // 10 seconds default timeout

  private getMessagesUrl(): string {
    return `${this.baseUrl}/${this.apiVersion}/${META_CONFIG.phoneNumberId}/messages`;
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${META_CONFIG.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, any>) {
    const logPayload = {
      timestamp: new Date().toISOString(),
      level,
      provider: 'MetaProvider',
      message,
      ...meta,
    };
    console.log(JSON.stringify(logPayload));
  }

  private validateRecipient(recipient: string): string {
    if (!recipient) {
      throw new Error('Recipient phone number is required.');
    }
    let sanitized = recipient.replace(/\D/g, '');
    if (!sanitized) {
      throw new Error(`Invalid recipient phone number format: "${recipient}"`);
    }
    return sanitized;
  }

  private async executeRequest(url: string, options: RequestInit): Promise<any> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(id);

      const responseText = await response.text();
      let responseData: any;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (err) {
        responseData = { rawResponse: responseText };
      }

      if (!response.ok) {
        throw {
          status: response.status,
          data: responseData,
        };
      }

      return responseData;
    } catch (error: any) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.requestTimeoutMs}ms`);
      }
      throw error;
    }
  }

  private buildErrorResult(error: any): SendResult {
    this.log('error', 'Meta API communication failed', { error });

    if (error && typeof error === 'object') {
      if (error.status && error.data) {
        const apiError = error.data.error || {};
        return {
          success: false,
          error: {
            code: apiError.code?.toString() || `HTTP_${error.status}`,
            message: apiError.message || 'Meta Cloud API returned an error response.',
            raw: error.data,
          },
        };
      }
      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'An unknown error occurred while sending message via Meta Cloud API.',
          raw: error,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: String(error),
      },
    };
  }

  // Implementation of sendText supporting both overloads
  async sendText(message: NotificationMessage): Promise<SendResult>;
  async sendText(to: string, text: string): Promise<SendResult>;
  async sendText(toOrMessage: string | NotificationMessage, text?: string): Promise<SendResult> {
    let canonicalMsg: NotificationMessage;
    if (typeof toOrMessage === 'string') {
      canonicalMsg = {
        recipient: toOrMessage,
        type: 'text',
        text: {
          body: text || '',
        },
      };
    } else {
      canonicalMsg = toOrMessage;
    }

    this.log('info', 'Sending text message', { recipient: canonicalMsg.recipient });
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        component: 'MetaProvider',
        message: 'MetaProvider send text starting',
        recipient: canonicalMsg.recipient,
      })
    );

    try {
      const to = this.validateRecipient(canonicalMsg.recipient);
      if (!canonicalMsg.text?.body) {
        throw new Error('Message text body is required for text messages.');
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: canonicalMsg.text.body,
        },
      };

      const response = await this.executeRequest(this.getMessagesUrl(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const messageId = response?.messages?.[0]?.id;

      this.log('info', 'Text message sent successfully', { messageId, recipient: to });

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      return this.buildErrorResult(error);
    }
  }

  // Implementation of sendTemplate supporting both overloads
  async sendTemplate(message: NotificationMessage): Promise<SendResult>;
  async sendTemplate(to: string, templateName: string, languageCode: string, components?: MessageComponent[]): Promise<SendResult>;
  async sendTemplate(
    toOrMessage: string | NotificationMessage,
    templateName?: string,
    languageCode?: string,
    components?: MessageComponent[]
  ): Promise<SendResult> {
    let canonicalMsg: NotificationMessage;
    if (typeof toOrMessage === 'string') {
      canonicalMsg = {
        recipient: toOrMessage,
        type: 'template',
        template: {
          name: templateName || '',
          languageCode: languageCode || 'en',
          components,
        },
      };
    } else {
      canonicalMsg = toOrMessage;
    }

    this.log('info', 'Sending template message', {
      recipient: canonicalMsg.recipient,
      templateName: canonicalMsg.template?.name,
    });
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        component: 'MetaProvider',
        message: 'MetaProvider send template starting',
        recipient: canonicalMsg.recipient,
        templateName: canonicalMsg.template?.name,
      })
    );

    try {
      const to = this.validateRecipient(canonicalMsg.recipient);
      if (!canonicalMsg.template?.name || !canonicalMsg.template?.languageCode) {
        throw new Error('Template name and languageCode are required.');
      }

      const metaComponents = canonicalMsg.template.components?.map((component) => {
        return {
          type: component.type,
          index: component.index,
          sub_type: component.sub_type,
          parameters: component.parameters.map((param) => {
            const mappedParam: any = { type: param.type };
            if (param.type === 'text') {
              mappedParam.text = param.text;
            } else if (param.type === 'payload') {
              mappedParam.payload = param.payload;
            } else if (param.type === 'image' && param.image) {
              mappedParam.image = param.image;
            } else if (param.type === 'document' && param.document) {
              mappedParam.document = param.document;
            } else if (param.type === 'video' && param.video) {
              mappedParam.video = param.video;
            }
            return mappedParam;
          }),
        };
      });

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: canonicalMsg.template.name,
          language: {
            code: canonicalMsg.template.languageCode,
          },
          ...(metaComponents && metaComponents.length > 0 ? { components: metaComponents } : {}),
        },
      };

      const response = await this.executeRequest(this.getMessagesUrl(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const messageId = response?.messages?.[0]?.id;

      this.log('info', 'Template message sent successfully', {
        messageId,
        recipient: to,
        templateName: canonicalMsg.template.name,
      });

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      return this.buildErrorResult(error);
    }
  }

  // Implementation of sendInteractiveTemplate supporting both overloads
  async sendInteractiveTemplate(message: NotificationMessage): Promise<SendResult>;
  async sendInteractiveTemplate(to: string, templateName: string, languageCode: string, components?: MessageComponent[]): Promise<SendResult>;
  async sendInteractiveTemplate(
    toOrMessage: string | NotificationMessage,
    templateName?: string,
    languageCode?: string,
    components?: MessageComponent[]
  ): Promise<SendResult> {
    if (typeof toOrMessage === 'string') {
      return this.sendTemplate(toOrMessage, templateName!, languageCode!, components);
    }
    return this.sendTemplate(toOrMessage);
  }

  async health(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
    const url = `${this.baseUrl}/${this.apiVersion}/${META_CONFIG.phoneNumberId}`;
    try {
      const response = await this.executeRequest(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response && response.id === META_CONFIG.phoneNumberId) {
        return { status: 'healthy' };
      }

      return {
        status: 'unhealthy',
        error: `Unexpected health check response structure: ${JSON.stringify(response)}`,
      };
    } catch (error: any) {
      const errorMessage = error?.data?.error?.message || error.message || String(error);
      return {
        status: 'unhealthy',
        error: errorMessage,
      };
    }
  }
}
