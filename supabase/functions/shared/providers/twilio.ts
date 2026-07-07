import { NotificationProviderInstance, SendResult } from "./interface.ts";

export class TwilioProvider implements NotificationProviderInstance {
  async send(recipient: string, message: string): Promise<SendResult> {
    try {
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const from = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "whatsapp:+14155238886";

      if (!accountSid || !authToken) {
        return {
          success: false,
          error: "Missing required Twilio environment credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN).",
        };
      }

      const toFormatted = recipient.startsWith("whatsapp:") ? recipient : `whatsapp:${recipient}`;
      const fromFormatted = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const basicAuth = btoa(`${accountSid}:${authToken}`);
      
      const requestBody = new URLSearchParams({
        From: fromFormatted,
        To: toFormatted,
        Body: message,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      });

      const responseText = await response.text();
      let responseJson;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { rawResponse: responseText };
      }

      if (response.ok) {
        console.log(`[TwilioProvider] Message delivered. recipient=${toFormatted} status=${response.status} messageSid=${responseJson.sid}`);
        return {
          success: true,
          messageId: responseJson.sid,
          rawResponse: responseJson,
        };
      } else {
        const errorMsg = responseJson.message || `HTTP ${response.status} Error: ${responseText}`;
        console.error(`[TwilioProvider] Delivery failed. recipient=${toFormatted} status=${response.status} error=${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
          rawResponse: responseJson,
        };
      }
    } catch (err: any) {
      console.error(`[TwilioProvider] Network or execution failure:`, err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }
}
