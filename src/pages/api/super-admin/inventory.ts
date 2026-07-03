import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { getQrInventory, getQrInventoryStats, generateQrAssetsCustom, getQrBatches, logActivity } from '@/lib/data';
import { QRAssetStatus } from '@prisma/client';

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
          status: status && status !== 'ALL' ? (status as QRAssetStatus) : null,
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
          const matchItem = item.qrCode.match(/^cqr-([A-Z]+)(\d+)$/i);
          const matchStart = b.startSerial.match(/^cqr-([A-Z]+)(\d+)$/i);
          const matchEnd = b.endSerial.match(/^cqr-([A-Z]+)(\d+)$/i);
          if (matchItem && matchStart && matchEnd && matchItem[1].toUpperCase() === matchStart[1].toUpperCase()) {
            const itemNum = parseInt(matchItem[2], 10);
            const startNum = parseInt(matchStart[2], 10);
            const endNum = parseInt(matchEnd[2], 10);
            return itemNum >= startNum && itemNum <= endNum;
          }
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

      // Legacy fallback: generate with Prefix A starting from 1 to qty
      const result = await generateQrAssetsCustom('A', 1, qty, sessionUser.id);

      // Log activity
      await logActivity(
        sessionUser.id,
        'QR Inventory Generated',
        'BUSINESS',
        null,
        { quantity: qty }
      );

      return res.status(201).json({
        message: `Successfully generated QR codes in inventory.`,
        batch: result
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Super Admin QR Inventory API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error managing QR inventory.' });
  }
}
