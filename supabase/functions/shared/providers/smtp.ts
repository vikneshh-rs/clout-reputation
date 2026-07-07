import { NotificationProviderInstance, SendResult } from "./interface.ts";

export class SmtpProvider implements NotificationProviderInstance {
  async send(recipient: string, message: string): Promise<SendResult> {
    try {
      const host = Deno.env.get("SMTP_HOST") || "smtp.mailtrap.io";
      const port = Deno.env.get("SMTP_PORT") || "2525";
      const user = Deno.env.get("SMTP_USER");
      
      console.log(`[SmtpProvider] --- SIMULATION START ---`);
      console.log(`[SmtpProvider] SMTP Server: ${host}:${port}`);
      console.log(`[SmtpProvider] User Configured: ${user ? "YES" : "NO"}`);
      console.log(`[SmtpProvider] Recipient Email: ${recipient}`);
      console.log(`[SmtpProvider] Message:\n${message}`);
      console.log(`[SmtpProvider] --- SIMULATION END ---`);
      
      const mockMessageId = `smtp_${Math.random().toString(36).substring(2, 12)}@cloutation.com`;
      return {
        success: true,
        messageId: mockMessageId,
        rawResponse: {
          messageId: mockMessageId,
          recipient,
          server: host,
          status: "delivered",
        },
      };
    } catch (err: any) {
      console.error(`[SmtpProvider] SMTP send failed:`, err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }
}
