import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { 
  getAllBusinesses, 
  onboardBusiness, 
  updateBusinessStatus,
  softDeleteBusiness, 
  restoreBusiness, 
  logActivity,
  updateBusinessDetails
} from '@/lib/data';
import { BusinessStatus, Industry, SubscriptionPlan } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    // GET Request: List all businesses
    if (req.method === 'GET') {
      const includeDeleted = req.query.includeDeleted === 'true';
      const businesses = await getAllBusinesses(includeDeleted);
      return res.status(200).json({ businesses });
    }

    // POST Request: Onboard business
    if (req.method === 'POST') {
      const { 
        name, 
        password, 
        industry, 
        phone, 
        address, 
        plan, 
        googleReviewUrl,
        logoUrl,
        description,
        contactPerson,
        category,
        website,
        googleMapsUrl,
        qrCode
      } = req.body;

      const finalName = name?.trim() || `New Business - ${Math.floor(100000 + Math.random() * 900000)}`;
      const finalPassword = password || '123456';
      const finalIndustry = industry || 'OTHER';

      // Validate URL format and Google Review Link structure if googleReviewUrl is provided
      if (googleReviewUrl) {
        const urlRegex = /^https?:\/\/.+/i;
        if (!urlRegex.test(googleReviewUrl)) {
          return res.status(400).json({ error: 'Invalid Google Review URL format. Must start with http:// or https://' });
        }
        if (!googleReviewUrl.includes('google.com') && !googleReviewUrl.includes('g.page')) {
          return res.status(400).json({ error: 'Invalid Google Review URL. Must be a Google domain link.' });
        }
      }

      // Validate industry enum
      if (finalIndustry && !Object.values(Industry).includes(finalIndustry as Industry)) {
        return res.status(400).json({ error: `Invalid industry. Must be one of: ${Object.values(Industry).join(', ')}` });
      }

      // Hash password
      const passwordHash = await hashPassword(finalPassword);
      
      const result = await onboardBusiness({
        name: finalName,
        passwordHash,
        industry: finalIndustry as Industry,
        phone: phone || null,
        address: address || null,
        googleReviewUrl: googleReviewUrl || null,
        plan: plan ? String(plan) : 'TRIAL_14',
        createdByRepId: sessionUser.id,
        logoUrl: logoUrl || null,
        description: description || null,
        contactPerson: contactPerson || null,
        category: category || null,
        website: website || null,
        googleMapsUrl: googleMapsUrl || null,
        qrCode: qrCode || null
      });
      
      // Log platform activity
      await logActivity(
        sessionUser.id,
        'Business Onboarded',
        'BUSINESS',
        result.business.id,
        { name: result.business.name, industry: result.business.industry }
      );

      return res.status(201).json({
        message: 'Business account onboarded successfully.',
        business: result.business
      });
    }

    // PUT Request: Update status or restore
    if (req.method === 'PUT') {
      const { 
        action, 
        id, 
        status, 
        name, 
        password, 
        industry, 
        phone, 
        address, 
        googleReviewUrl, 
        logoUrl, 
        description, 
        contactPerson, 
        category, 
        website, 
        googleMapsUrl 
      } = req.body;

      if (action === 'edit') {
        if (!id) {
          return res.status(400).json({ error: 'Business ID is required.' });
        }

        const updateData: any = {
          name,
          industry,
          phone: phone || null,
          address: address || null,
          googleReviewUrl: googleReviewUrl || null,
          logoUrl: logoUrl || null,
          description: description || null,
          contactPerson: contactPerson || null,
          category: category || null,
          website: website || null,
          googleMapsUrl: googleMapsUrl || null
        };

        if (password) {
          updateData.passwordHash = await hashPassword(password);
        }

        const updated = await updateBusinessDetails(id, updateData);

        if (!updated) {
          return res.status(404).json({ error: 'Business not found.' });
        }

        await logActivity(
          sessionUser.id,
          'Business Details Updated by Admin',
          'BUSINESS',
          id,
          { name: updated.name }
        );

        return res.status(200).json({
          message: 'Business details updated successfully.',
          business: updated
        });
      }

      if (action === 'status') {
        if (!id || !status) {
          return res.status(400).json({ error: 'Business ID and status are required.' });
        }

        if (!Object.values(BusinessStatus).includes(status)) {
          return res.status(400).json({ error: `Invalid status. Must be one of: ${Object.values(BusinessStatus).join(', ')}` });
        }

        const updated = await updateBusinessStatus(id, status as BusinessStatus, sessionUser.id);
        return res.status(200).json({
          message: `Business status updated to "${status}" successfully.`,
          business: updated
        });
      }

      if (action === 'restore') {
        if (!id) {
          return res.status(400).json({ error: 'Business ID is required.' });
        }

        const restored = await restoreBusiness(id);
        if (!restored) {
          return res.status(404).json({ error: 'Business not found.' });
        }

        // Log activity
        await logActivity(
          sessionUser.id,
          'Business Restored',
          'BUSINESS',
          id,
          { name: restored.name }
        );

        return res.status(200).json({
          message: `Business "${restored.name}" restored successfully.`,
          business: restored
        });
      }

      return res.status(400).json({ error: 'Invalid update action.' });
    }

    // DELETE Request: Soft-delete business
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Business ID is required.' });
      }

      const deleted = await softDeleteBusiness(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Business not found.' });
      }

      // Log activity
      await logActivity(
        sessionUser.id,
        'Business Deleted',
        'BUSINESS',
        id,
        { name: deleted.name }
      );

      return res.status(200).json({ message: 'Business soft-deleted successfully.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Super Admin businesses endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error managing businesses' });
  }
}
