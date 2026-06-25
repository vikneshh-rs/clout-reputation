import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { getQrInventory, getQrInventoryStats, generateQrInventory, getQrBatches, logActivity } from '@/lib/data';
import { QRStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    if (req.method === 'GET') {
      const { status, search, batchId } = req.query;
      const [inventory, stats, batches] = await Promise.all([
        getQrInventory({
          status: status && status !== 'ALL' ? (status as QRStatus) : null,
          search: search ? String(search) : null,
          batchId: batchId ? String(batchId) : null
        }),
        getQrInventoryStats(),
        getQrBatches()
      ]);

      const mappedBatches = batches.map(b => ({
        id: b.id,
        name: b.batchName,
        createdAt: b.generatedAt.toISOString ? b.generatedAt.toISOString() : b.generatedAt,
        _count: {
          codes: b.quantity
        }
      }));

      const mappedInventory = inventory.map(item => {
        const batch = batches.find(b => {
          return item.qrCode >= b.startSerial && item.qrCode <= b.endSerial;
        });
        return {
          ...item,
          batch: batch ? { id: batch.id, name: batch.batchName } : null
        };
      });
      
      return res.status(200).json({ inventory: mappedInventory, stats, batches: mappedBatches });
    }

    if (req.method === 'POST') {
      const { quantity } = req.body;
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive integer.' });
      }

      const count = await generateQrInventory(qty, sessionUser.id);

      // Log activity
      await logActivity(
        sessionUser.id,
        'QR Inventory Generated',
        'BUSINESS',
        null,
        { quantity: qty }
      );

      return res.status(201).json({
        message: `Successfully generated ${count} QR codes in inventory.`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Super Admin QR Inventory API error:', error);
    return res.status(500).json({ error: 'Internal server error managing QR inventory.' });
  }
}
