import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, getAuthorizedBusinessId } from '@/lib/auth';
import { getBusinessById, updateBusinessDetails, logActivity } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }

    const businessId = getAuthorizedBusinessId(req, sessionUser);
    if (!businessId) {
      return res.status(403).json({ error: 'Forbidden. Access to business denied.' });
    }

    // GET Request: Retrieve business profile
    if (req.method === 'GET') {
      const business = await getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }
      return res.status(200).json({ business });
    }

    // PUT Request: Update business details
    if (req.method === 'PUT') {
      if (sessionUser.role === 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Super Admin view is read-only.' });
      }
      const { name, googleReviewUrl, phone, address, enableGoogleReviewRedirect, enableManagerCallback, logoUrl } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Business name is required.' });
      }

      const currentBusiness = await getBusinessById(businessId);
      if (!currentBusiness) {
        return res.status(404).json({ error: 'Business not found' });
      }

      const updated = await updateBusinessDetails(businessId, {
        name,
        googleReviewUrl: googleReviewUrl || null,
        phone: phone || null,
        address: address || null,
        enableGoogleReviewRedirect: enableGoogleReviewRedirect !== undefined ? !!enableGoogleReviewRedirect : undefined,
        enableManagerCallback: enableManagerCallback !== undefined ? !!enableManagerCallback : undefined,
        logoUrl: logoUrl || null
      });

      // Capture changes for activity log metadata
      const changes: Record<string, any> = {};
      if (currentBusiness.name !== name) changes.name = name;
      if (currentBusiness.googleReviewUrl !== googleReviewUrl) changes.googleReviewUrl = googleReviewUrl;
      if (currentBusiness.phone !== phone) changes.phone = phone;
      if (currentBusiness.address !== address) changes.address = address;
      if (currentBusiness.logoUrl !== logoUrl) changes.logoUrl = logoUrl;
      if (enableGoogleReviewRedirect !== undefined && currentBusiness.enableGoogleReviewRedirect !== enableGoogleReviewRedirect) {
        changes.enableGoogleReviewRedirect = enableGoogleReviewRedirect;
      }
      if (enableManagerCallback !== undefined && currentBusiness.enableManagerCallback !== enableManagerCallback) {
        changes.enableManagerCallback = enableManagerCallback;
      }

      // Log activity
      await logActivity(
        sessionUser.id,
        'Business Updated',
        'BUSINESS',
        businessId,
        { changes }
      );

      return res.status(200).json({
        message: 'Business profile updated successfully.',
        business: updated
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Business details API error:', error);
    return res.status(500).json({ error: 'Internal server error managing business details' });
  }
}
