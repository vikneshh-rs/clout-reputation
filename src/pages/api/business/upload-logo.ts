import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Disable default bodyParser to handle larger payloads if needed,
// but since logo files are small, standard JSON payload is fine.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { logoBase64, mimeType, filename } = req.body;
    if (!logoBase64) {
      return res.status(400).json({ error: 'Logo data is required' });
    }

    // Extract the raw base64 data
    const matches = logoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let base64Data = logoBase64;
    let detectedMime = mimeType || 'image/png';

    if (matches && matches.length === 3) {
      detectedMime = matches[1];
      base64Data = matches[2];
    }

    // Security check: Validate mime-type to prevent Arbitrary File Upload (Stored XSS)
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(detectedMime.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid file type. Only PNG, JPEG, JPG, GIF, and WEBP images are allowed.' });
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Security check: Restrict logo size to 5MB to prevent disk flooding
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSizeBytes) {
      return res.status(400).json({ error: 'File is too large. Maximum size allowed is 5MB.' });
    }

    const ext = detectedMime.split('/')[1] || 'png';
    const uniqueFilename = `${crypto.randomUUID()}.${ext}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // 1. SUPABASE UPLOAD PATH
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.storage
          .from('business-logos')
          .upload(uniqueFilename, buffer, {
            contentType: detectedMime,
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          throw error;
        }

        // Return public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/business-logos/${uniqueFilename}`;
        return res.status(200).json({ url: publicUrl });
      } catch (err: any) {
        console.warn('Supabase storage upload failed, falling back to local storage:', err.message || err);
      }
    }

    // 2. LOCAL FALLBACK UPLOAD PATH
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadDir, uniqueFilename), buffer);
    const localUrl = `/uploads/${uniqueFilename}`;
    
    return res.status(200).json({ url: localUrl });
  } catch (error: any) {
    console.error('Logo upload API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error uploading logo' });
  }
}
