import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { Readable } from 'stream';
import { MetaWebhookService } from '../../../lib/notifications/services/MetaWebhookService';

export const config = {
  api: {
    bodyParser: false, // Disable body parser to get raw body buffer for signature validation
  },
};

async function getRawBody(readable: Readable): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // GET: Meta Webhook Verification
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.META_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[Webhook Verification] Token verified successfully.');
      return res.status(200).send(challenge);
    } else {
      console.warn('[Webhook Verification] Verification failed: Token mismatch.');
      return res.status(403).json({ error: 'Forbidden. Verification token mismatch.' });
    }
  } else if (req.method === 'POST') {
    // POST: Meta Event Receiver
    try {
      const rawBody = await getRawBody(req);
      const signature = req.headers['x-hub-signature-256'] as string;

      if (!signature) {
        console.warn('[Webhook POST] Signature header missing.');
        return res.status(401).json({ error: 'Signature header missing.' });
      }

      const appSecret = process.env.META_APP_SECRET || '';
      const hmac = crypto.createHmac('sha256', appSecret);
      const calculatedSignature = 'sha256=' + hmac.update(rawBody).digest('hex');

      if (signature !== calculatedSignature) {
        console.warn('[Webhook POST] Signature mismatch.');
        return res.status(401).json({ error: 'Signature verification failed.' });
      }

      let payload: any;
      try {
        payload = JSON.parse(rawBody.toString('utf-8'));
      } catch (err: any) {
        console.error('[Webhook POST] Malformed payload:', err.message);
        return res.status(400).json({ error: 'Malformed JSON payload.' });
      }

      const result = await MetaWebhookService.process(payload);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('[Webhook POST] Unhandled exception:', err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }
}
