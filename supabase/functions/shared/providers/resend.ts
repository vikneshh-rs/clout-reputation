import { NotificationProviderInstance, SendResult } from "./interface.ts";

export class ResendProvider implements NotificationProviderInstance {
  async send(recipient: string, message: string): Promise<SendResult> {
    try {
      const apiKey = Deno.env.get("RESEND_API_KEY");
      console.log(`[ResendProvider] --- SIMULATION START ---`);
      console.log(`[ResendProvider] API Key Configured: ${apiKey ? "YES" : "NO"}`);
      console.log(`[ResendProvider] Recipient Email: ${recipient}`);
      console.log(`[ResendProvider] Message:\n${message}`);
      console.log(`[ResendProvider] --- SIMULATION END ---`);
      
      const mockMessageId = `re_${Math.random().toString(36).substring(2, 12)}`;
      return {
        success: true,
        messageId: mockMessageId,
        rawResponse: {
          id: mockMessageId,
          recipient,
          provider: "resend",
          sent_at: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      console.error(`[ResendProvider] Failed to send email:`, err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }
}
