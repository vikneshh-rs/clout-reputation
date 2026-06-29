import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { 
  onboardBusiness,
  assignQrToBusiness,
  replaceDamagedQr, 
  toggleQrInactive, 
  validateQrCode,
  logActivity 
} from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || (sessionUser.role !== 'REP' && sessionUser.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Access denied. Field Representative role required.' });
    }

    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action parameter is required.' });
    }

    // 0. VALIDATE QR Code
    if (action === 'VALIDATE') {
      const { qrCode } = req.body;
      if (!qrCode) {
        return res.status(400).json({ error: 'QR Code is required for validation.' });
      }

      const qrRecord = await validateQrCode(qrCode);
      if (!qrRecord) {
        return res.status(404).json({ error: 'QR Code does not exist in inventory.' });
      }

      return res.status(200).json({ qrInventory: qrRecord });
    }

    // 1. ASSIGN QR Code (Includes optional on-the-fly business onboarding)
    if (action === 'ASSIGN') {
      const { qrCode, businessId, businessDetails } = req.body;
      if (!qrCode) {
        return res.status(400).json({ error: 'QR Code is required.' });
      }

      let targetBusinessId = businessId;

      // Onboard business first if details are provided
      if (businessDetails) {
        const { name, industry, password, phone, address, googleReviewUrl, plan } = businessDetails;
        if (!name || !industry || !password) {
          return res.status(400).json({ error: 'Missing business name, industry, or password.' });
        }

        const passwordHash = await hashPassword(password);
        const onboardResult = await onboardBusiness({
          name,
          passwordHash,
          industry,
          phone,
          address,
          googleReviewUrl,
          plan,
          createdByRepId: sessionUser.id
        });

        targetBusinessId = onboardResult.business.id;
      }

      if (!targetBusinessId) {
        return res.status(400).json({ error: 'Missing parameters. Either businessId or businessDetails must be provided.' });
      }

      const result = await assignQrToBusiness({
        qrCode,
        businessId: targetBusinessId,
        repId: sessionUser.id
      });

      // Log platform activity
      await logActivity(
        sessionUser.id,
        'QR Code Assigned',
        'BUSINESS',
        targetBusinessId,
        { qrCode, businessId: targetBusinessId }
      );

      return res.status(200).json({
        message: `Successfully assigned QR "${qrCode}" to Business.`,
        ...result
      });
    }

    // 2. REPLACE DAMAGED QR
    if (action === 'REPLACE') {
      const { oldQrCode, newQrCode } = req.body;
      if (!oldQrCode || !newQrCode) {
        return res.status(400).json({ error: 'Both old and new QR codes are required.' });
      }

      const result = await replaceDamagedQr({
        oldQrCode,
        newQrCode,
        repId: sessionUser.id,
        repRole: sessionUser.role
      });

      await logActivity(
        sessionUser.id,
        'QR Code Replaced',
        'BUSINESS',
        result.newQr.assignedBusinessId,
        { oldQrCode, newQrCode }
      );

      return res.status(200).json({
        message: `Successfully replaced damaged QR "${oldQrCode}" with "${newQrCode}".`,
        ...result
      });
    }

    // 3. TOGGLE INACTIVE
    if (action === 'TOGGLE_INACTIVE') {
      const { qrCode, inactive } = req.body;
      if (!qrCode || inactive === undefined) {
        return res.status(400).json({ error: 'QR Code and inactive state parameters are required.' });
      }

      const result = await toggleQrInactive(qrCode, !!inactive, sessionUser.id, sessionUser.role);
      
      const activityText = inactive ? 'QR Code Deactivated' : 'QR Code Reactivated';
      await logActivity(
        sessionUser.id,
        activityText,
        'BUSINESS',
        result.assignedBusinessId,
        { qrCode }
      );

      return res.status(200).json({
        message: `Successfully toggled QR "${qrCode}" to status "${result.status}".`,
        qrInventory: result
      });
    }

    return res.status(400).json({ error: 'Invalid action parameter value.' });
  } catch (error: any) {
    console.error('Rep QR assignment API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error processing assignment.' });
  }
}
