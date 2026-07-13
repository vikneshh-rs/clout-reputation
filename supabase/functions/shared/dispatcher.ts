import { TwilioProvider } from "./providers/twilio.ts";
import { MetaProvider } from "./providers/meta.ts";
import { ResendProvider } from "./providers/resend.ts";
import { SmtpProvider } from "./providers/smtp.ts";
import { NotificationProviderInstance } from "./providers/interface.ts";
import { templates } from "./templates/index.ts";

/**
 * Resolves the configured provider instance dynamically.
 */
export function resolveProvider(providerName: string): NotificationProviderInstance {
  switch (providerName) {
    case "TWILIO":
      return new TwilioProvider();
    case "META":
      return new MetaProvider();
    case "RESEND":
      return new ResendProvider();
    case "SMTP":
      return new SmtpProvider();
    default:
      throw new Error(`Unsupported notification provider: ${providerName}`);
  }
}

/**
 * Resolves the message template based on event type.
 */
export function resolveTemplate(eventType: string, payload: any): string {
  const formatter = templates[eventType];
  if (!formatter) {
    throw new Error(`Unsupported event type template: ${eventType}`);
  }
  return formatter(payload);
}

export class NotificationProviderFactory {
  static getProvider(providerName: string): NotificationProviderInstance {
    return resolveProvider(providerName);
  }
}
