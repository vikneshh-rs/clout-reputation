import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { getAllBusinesses, onboardBusiness, logActivity, updateBusinessDetails, getBusinessById } from '@/lib/data';
import { Industry, SubscriptionPlan, BusinessStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || (sessionUser.role !== 'REP' && sessionUser.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Access denied. Representative or Admin role required.' });
    }

    // GET handler: list businesses with full details
    if (req.method === 'GET') {
      let businesses = await getAllBusinesses(false); // active/pending/inactive (getAllBusinesses(false) returns active ones)
      
      // Security/UX check: Filter businesses if user is a REP
      if (sessionUser.role === 'REP') {
        businesses = businesses.filter(b => b.createdByRepId === sessionUser.id);
      }
      
      return res.status(200).json({ businesses });
    }

    // POST handler: Representative onboarding a business
    if (req.method === 'POST') {
      const { 
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
        plan: SubscriptionPlan.TRIAL, // Rep onboarded starts with trial
        createdByRepId: sessionUser.id,
        logoUrl: logoUrl || null,
        description: description || null,
        contactPerson: contactPerson || null,
        category: category || null,
        website: website || null,
        googleMapsUrl: googleMapsUrl || null,
        qrCode: qrCode || null
      });
      
      // Log representative activity
      await logActivity(
        sessionUser.id,
        'Business Onboarded by Representative',
        'BUSINESS',
        result.business.id,
        { name: result.business.name, industry: result.business.industry }
      );

      return res.status(201).json({
        message: 'Business account onboarded successfully.',
        business: result.business
      });
    }

    if (req.method === 'PUT') {
      const { 
        id,
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

      if (!id) {
        return res.status(400).json({ error: 'Business ID is required.' });
      }

      // Security check: if REP, verify they created it (super admin has bypass)
      if (sessionUser.role === 'REP') {
        const existingBiz = await getBusinessById(id);
        if (!existingBiz || existingBiz.createdByRepId !== sessionUser.id) {
          return res.status(403).json({ error: 'Access denied. You can only edit businesses created by you.' });
        }
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
        'Business Details Updated',
        'BUSINESS',
        id,
        { name: updated.name }
      );

      return res.status(200).json({
        message: 'Business details updated successfully.',
        business: updated
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Representative businesses API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error processing businesses.' });
  }
}
