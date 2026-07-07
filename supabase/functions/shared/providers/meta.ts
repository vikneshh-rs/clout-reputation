import { NotificationProviderInstance, SendResult } from "./interface.ts";

export class MetaProvider implements NotificationProviderInstance {
  async send(recipient: string, message: string): Promise<SendResult> {
    try {
      console.log(`[MetaProvider] --- SIMULATION START ---`);
      console.log(`[MetaProvider] Recipient: ${recipient}`);
      console.log(`[MetaProvider] Message:\n${message}`);
      console.log(`[MetaProvider] --- SIMULATION END ---`);
      
      // Simulate successful Meta WhatsApp Cloud API response
      const mockMessageId = `wamid.HBgL${Math.random().toString(36).substring(2, 12)}`;
      return {
        success: true,
        messageId: mockMessageId,
        rawResponse: {
          messaging_product: "whatsapp",
          contacts: [{ input: recipient, wa_id: recipient.replace(/\+/g, "") }],
          messages: [{ id: mockMessageId }],
        },
      };
    } catch (err: any) {
      console.error(`[MetaProvider] Failed to send message via Meta:`, err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }
}
