import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Store, 
  Plus, 
  Search, 
  ExternalLink, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  X,
  MapPin,
  Phone,
  Calendar,
  Lock,
  Image as ImageIcon,
  Globe,
  User,
  Map,
  FileText,
  Download,
  QrCode,
  Check,
  ChevronRight,
  Sliders,
  Play,
  Trash2
} from 'lucide-react';

interface Subscription {
  id: string;
  plan: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  endDate: string;
}

interface QRRecord {
  id: string;
  qrCode: string;
  status: 'ASSIGNED' | 'FREE';
  createdAt: string;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  businessCode: string;
  industry: 'RESTAURANT' | 'CAFE' | 'SALON' | 'RESORT' | 'HOTEL' | 'CLINIC' | 'GYM' | 'SPA' | 'RETAIL_STORE' | 'OTHER';
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  googleReviewUrl: string | null;
  description: string | null;
  contactPerson: string | null;
  category: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  createdByRep: {
    id: string;
    name: string;
  } | null;
  subscriptions?: Subscription[];
  qrAssets?: QRRecord[];
  totalDownloads?: number;
  lastDownloadDate?: string | null;
  whatsappNumber?: string | null;
  notificationSettings?: any;
}

export default function BusinessesManagementPage(props: any) {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  // State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal / Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingBusiness, setViewingBusiness] = useState<Business | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  
  // Onboarding Form State
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    industry: 'RESTAURANT',
    phone: '',
    address: '',
    plan: 'TRIAL_14',
    googleReviewUrl: '',
    logoUrl: '',
    description: '',
    contactPerson: '',
    category: '',
    website: '',
    googleMapsUrl: '',
    whatsappNumber: '',
    negativeReviewEnabled: true,
    positiveReviewEnabled: false,
    dailySummaryEnabled: false,
    weeklySummaryEnabled: false,
    whatsappEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
    quietHoursStart: '',
    quietHoursEnd: '',
    timezone: 'UTC'
  });
  
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loadingRecentJobs, setLoadingRecentJobs] = useState(false);

  useEffect(() => {
    if (!viewingBusiness?.id) {
      setRecentJobs([]);
      return;
    }
    setLoadingRecentJobs(true);
    fetch(`/api/super-admin/notifications/jobs?businessId=${viewingBusiness.id}&limit=5`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setRecentJobs(data.jobs || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingRecentJobs(false));
  }, [viewingBusiness?.id]);

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [googleUrlWarning, setGoogleUrlWarning] = useState('');

  // QR Actions State
  const [qrGenerating, setQrGenerating] = useState(false);
  const [qrActionMsg, setQrActionMsg] = useState('');

  // Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Free QR Assignment State (for onboarding form)
  const [freeQrs, setFreeQrs] = useState<string[]>([]);
  const [freeQrsLoading, setFreeQrsLoading] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState('');

  const fetchFreeQrs = async () => {
    try {
      setFreeQrsLoading(true);
      const res = await fetch('/api/rep/free-qrs');
      if (res.ok) {
        const data = await res.json();
        setFreeQrs(data.qrCodes || []);
      }
    } catch (_) {
      // silently fail — user can still auto-assign
    } finally {
      setFreeQrsLoading(false);
    }
  };


  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/super-admin/businesses');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
        
        // If we are currently viewing a business, refresh its data in the drawer
        if (viewingBusiness) {
          const updatedBiz = (data.businesses || []).find((b: Business) => b.id === viewingBusiness.id);
          if (updatedBiz) setViewingBusiness(updatedBiz);
        }
      } else {
        setError('Failed to fetch businesses.');
      }
    } catch (err) {
      setError('Network error fetching businesses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchBusinesses();
    }
  }, [user]);

  // Google review url validator helper
  const handleGoogleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, googleReviewUrl: url }));
    if (!url) {
      setGoogleUrlWarning('');
      return;
    }
    const isGoogle = url.includes('google.com') || url.includes('g.page');
    if (!isGoogle) {
      setGoogleUrlWarning('Warning: This URL does not look like a standard Google review link. Please verify it.');
    } else {
      setGoogleUrlWarning('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant local preview
    const localReader = new FileReader();
    localReader.onload = () => {
      setLogoPreview(localReader.result as string);
    };
    localReader.readAsDataURL(file);

    try {
      setLogoUploading(true);
      setFormError('');
      
      const uploadReader = new FileReader();
      uploadReader.readAsDataURL(file);
      uploadReader.onload = async () => {
        try {
          const res = await fetch('/api/business/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              logoBase64: uploadReader.result,
              mimeType: file.type,
              filename: file.name
            })
          });
          if (res.ok) {
            const data = await res.json();
            setFormData(prev => ({ ...prev, logoUrl: data.url }));
          } else {
            const errData = await res.json();
            setFormError(errData.error || 'Failed to upload logo image.');
          }
        } catch (err) {
          setFormError('Network error uploading logo.');
        } finally {
          setLogoUploading(false);
        }
      };
    } catch (err) {
      setFormError('FileReader error.');
      setLogoUploading(false);
    }
  };

  const openOnboardModal = () => {
    setFormData({
      name: '',
      password: '',
      industry: 'RESTAURANT',
      phone: '',
      address: '',
      plan: 'TRIAL_14',
      googleReviewUrl: '',
      logoUrl: '',
      description: '',
      contactPerson: '',
      category: 'Restaurant',
      website: '',
      googleMapsUrl: '',
      whatsappNumber: '',
      negativeReviewEnabled: true,
      positiveReviewEnabled: false,
      dailySummaryEnabled: false,
      weeklySummaryEnabled: false,
      whatsappEnabled: true,
      emailEnabled: false,
      smsEnabled: false,
      quietHoursStart: '',
      quietHoursEnd: '',
      timezone: 'UTC'
    });
    setLogoPreview('');
    setFormError('');
    setGoogleUrlWarning('');
    setSelectedQrCode('');
    setIsEditing(false);
    setEditingBusinessId(null);
    fetchFreeQrs();
    setIsModalOpen(true);
  };

  const openEditModal = (biz: Business) => {
    setFormData({
      name: biz.name || '',
      password: '',
      industry: biz.industry || 'RESTAURANT',
      phone: biz.phone || '',
      address: biz.address || '',
      plan: biz.subscriptions?.[0]?.plan || 'TRIAL_14',
      googleReviewUrl: biz.googleReviewUrl || '',
      logoUrl: biz.logoUrl || '',
      description: biz.description || '',
      contactPerson: biz.contactPerson || '',
      category: biz.category || '',
      website: biz.website || '',
      googleMapsUrl: biz.googleMapsUrl || '',
      whatsappNumber: biz.whatsappNumber || '',
      negativeReviewEnabled: (biz as any).notificationSettings?.negativeReviewEnabled ?? true,
      positiveReviewEnabled: (biz as any).notificationSettings?.positiveReviewEnabled ?? false,
      dailySummaryEnabled: (biz as any).notificationSettings?.dailySummaryEnabled ?? false,
      weeklySummaryEnabled: (biz as any).notificationSettings?.weeklySummaryEnabled ?? false,
      whatsappEnabled: (biz as any).notificationSettings?.whatsappEnabled ?? true,
      emailEnabled: (biz as any).notificationSettings?.emailEnabled ?? false,
      smsEnabled: (biz as any).notificationSettings?.smsEnabled ?? false,
      quietHoursStart: (biz as any).notificationSettings?.quietHoursStart || '',
      quietHoursEnd: (biz as any).notificationSettings?.quietHoursEnd || '',
      timezone: (biz as any).notificationSettings?.timezone || 'UTC'
    });
    setLogoPreview(biz.logoUrl || '');
    setFormError('');
    setGoogleUrlWarning('');
    setSelectedQrCode('');
    setIsEditing(true);
    setEditingBusinessId(biz.id);
    setIsModalOpen(true);
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    setError('');

    if (formData.googleReviewUrl && !formData.googleReviewUrl.startsWith('http://') && !formData.googleReviewUrl.startsWith('https://')) {
      setFormError('Google Review URL must begin with http:// or https://');
      return;
    }

    try {
      setSubmitting(true);
      const url = '/api/super-admin/businesses';
      const method = isEditing ? 'PUT' : 'POST';
      const bodyPayload = isEditing
        ? { ...formData, id: editingBusinessId, action: 'edit' }
        : { ...formData, qrCode: selectedQrCode || null };

      if (isEditing && !formData.password) {
        delete (bodyPayload as any).password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(isEditing ? `Business "${formData.name}" updated successfully.` : `Business "${formData.name}" onboarded successfully.`);
        setIsModalOpen(false);
        fetchBusinesses();
      } else {
        setFormError(data.error || 'Failed to submit business.');
      }
    } catch (err) {
      setFormError('Network error submitting business.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (biz: Business) => {
    setBusinessToDelete(biz);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!businessToDelete) return;
    try {
      setDeleting(true);
      setError('');
      setSuccess('');
      
      const res = await fetch(`/api/super-admin/businesses?id=${businessToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setSuccess(`Business "${businessToDelete.name}" deleted successfully.`);
        setIsDeleteModalOpen(false);
        fetchBusinesses(); // Refresh the list
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete business.');
      }
    } catch (err) {
      setError('Network error deleting business.');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (biz: Business) => {
    setSuccess('');
    setError('');

    const nextStatus = biz.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmMsg = nextStatus === 'INACTIVE'
      ? `Are you sure you want to set "${biz.name}" status to INACTIVE? Customers will not be able to scan and write reviews.`
      : `Are you sure you want to set "${biz.name}" status to ACTIVE?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/super-admin/businesses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          id: biz.id,
          status: nextStatus
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Business "${biz.name}" status updated to ${nextStatus}.`);
        fetchBusinesses();
      } else {
        setError(data.error || 'Failed to update status.');
      }
    } catch (err) {
      setError('Network error updating business status.');
    }
  };

  // Profile calculations
  const computeProfileCompletion = (biz: Business) => {
    let pct = 0;
    if (biz.name) pct += 10;
    if (biz.logoUrl) pct += 15;
    if (biz.description) pct += 15;
    if (biz.contactPerson) pct += 10;
    if (biz.phone) pct += 10;
    if (biz.address) pct += 10;
    if (biz.googleReviewUrl) pct += 10;
    if (biz.category) pct += 10;
    if (biz.website) pct += 5;
    if (biz.googleMapsUrl) pct += 5;
    return pct;
  };

  const getSetupState = (pct: number) => {
    if (pct < 50) return { label: 'Setup Incomplete', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (pct < 85) return { label: 'Ready To Launch', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Live', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  // Generate on-demand business QR Code
  const handleGenerateQr = async (businessId: string) => {
    try {
      setQrGenerating(true);
      setQrActionMsg('');
      const res = await fetch('/api/business/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });
      if (res.ok) {
        setQrActionMsg('Successfully generated new active QR Code!');
        fetchBusinesses();
      } else {
        const data = await res.json();
        setQrActionMsg(data.error || 'Failed to generate QR Code.');
      }
    } catch (err) {
      setQrActionMsg('Network error generating QR.');
    } finally {
      setQrGenerating(false);
    }
  };

  // Download branded PDF sticker sheet
  const handleDownloadBrandedSheet = async (biz: Business) => {
    const activeQr = biz.qrAssets?.find(q => q.status === 'ASSIGNED');
    if (!activeQr) {
      alert('Please generate an active QR asset first before downloading.');
      return;
    }

    try {
      setQrActionMsg('Preparing branded sheet PDF...');
      const { jsPDF } = await import('jspdf');
      const QRCode = (await import('qrcode')).default;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [105, 148]
      });

      const width = 105;
      const height = 148;

      // 1. Subtle, clean border with rounded corners of 5mm
      doc.setDrawColor(229, 231, 235); // #E5E7EB
      doc.setLineWidth(0.5);
      doc.roundedRect(6, 6, width - 12, height - 12, 5, 5, 'S');

      // 2. Business Name (elegant serif font, size 24pt or scaled down)
      let fontFamily = 'times';
      try {
        const availableFonts = doc.getFontList();
        if (availableFonts && availableFonts['Playfair Display']) {
          fontFamily = 'Playfair Display';
        } else if (availableFonts && availableFonts['Cormorant Garamond']) {
          fontFamily = 'Cormorant Garamond';
        }
      } catch (e) {
        console.warn('Error checking font list', e);
      }

      doc.setFont(fontFamily, 'bold');
      
      let fontSize = 24;
      let nameLines: string[] = [];
      const maxTextWidth = 85; // Allow margins
      
      while (fontSize >= 14) {
        doc.setFontSize(fontSize);
        nameLines = doc.splitTextToSize(biz.name, maxTextWidth);
        const lineHeightInMm = fontSize * 1.15 * 0.3528;
        const totalHeight = nameLines.length * lineHeightInMm;
        // We want the text to fit comfortably in the y = 8 to 36 region (max height ~18mm)
        if (totalHeight <= 18 || fontSize === 14) {
          break;
        }
        fontSize -= 2;
      }

      const lineHeightInMm = fontSize * 1.15 * 0.3528;
      // Midpoint of vertical area (6 to 38) is 22.
      // Offset by half of total lines height, adjusting for baseline.
      const yStart = 22 - ((nameLines.length - 1) * lineHeightInMm / 2);
      
      doc.setTextColor(17, 24, 39); // Neutral 900
      doc.text(nameLines, width / 2, yStart, { align: 'center' });

      // 3. QR Code: occupying approx 70-75% of printable card width (e.g. 76mm is ~72.38%)
      const targetUrl = `${window.location.origin}/r/${activeQr.qrCode}`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 400, margin: 1 });
      doc.addImage(qrDataUrl, 'PNG', 14.5, 38, 76, 76);

      // 4. "Scan to Review" centered in Helvetica-Bold (sans-serif, size 16pt, neutral gray `#4B5563`)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(75, 85, 99); // #4B5563
      doc.text('Scan to Review', width / 2, 132, { align: 'center' });

      doc.save(`${biz.name.replace(/\s+/g, '_')}_Review_Sheet.pdf`);
      setQrActionMsg('Download complete!');

      // Track the download in DB
      await fetch('/api/business/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: biz.id })
      });
      fetchBusinesses();
    } catch (err) {
      console.error(err);
      setQrActionMsg('Failed downloading printable sheet.');
    }
  };

  // Category listing
  const getUniqueCategories = () => {
    const list = businesses.map(b => b.category || b.industry).filter(Boolean);
    return Array.from(new Set(list));
  };

  const filteredBusinesses = businesses.filter((biz) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      biz.name.toLowerCase().includes(query) ||
      biz.businessCode.toLowerCase().includes(query) ||
      (biz.contactPerson || '').toLowerCase().includes(query);

    const matchesCategory = 
      categoryFilter === 'ALL' || 
      biz.category === categoryFilter || 
      biz.industry === categoryFilter;

    const matchesStatus = 
      statusFilter === 'ALL' || biz.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <DashboardLayout title="Client Businesses & Onboarding" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Businesses & Onboarding - Cloutation</title>
      </Head>

      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <p className="text-xs text-slate-500 mt-0.5">Onboard client businesses, configure profiles, generate QR codes, and monitor completion progress.</p>
        <button
          onClick={openOnboardModal}
          className="bg-gradient-to-r from-blue-600 to-[#073afe] hover:from-blue-700 hover:to-indigo-750 text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 self-start sm:self-auto transition-all shadow-md shadow-blue-500/10 active:scale-[0.98]"
        >
          <Plus size={14} />
          Onboard Business
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
          <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-xs flex items-start">
          <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Directory Table */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-100/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.015)]">
        {/* Filters bar */}
        <div className="p-6 border-b border-slate-100/60 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2.5">
            <Store size={16} className="text-[#073afe]" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-sans">Business Directory</h4>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:flex-grow-0">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={13} className="text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search business, code, rep..."
                className="pl-9 pr-3 py-1.5 w-full sm:w-56 text-xs border border-slate-200 rounded-xl bg-white/60 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-700 font-semibold"
            >
              <option value="ALL">All Categories</option>
              {getUniqueCategories().map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-700 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Directory List Table */}
        <div className="overflow-x-auto">
          {loading && businesses.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-6 w-6 text-[#073afe] mx-auto mb-2.5" />
              <span className="text-xs text-slate-400 font-medium">Loading businesses...</span>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No businesses found matching criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-sans">
              <thead className="bg-slate-50/50 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Business</th>
                  <th className="px-6 py-3">Code & Category</th>
                  <th className="px-6 py-3">Setup Progress</th>
                  <th className="px-6 py-3">Onboarded By</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent">
                {filteredBusinesses.map((biz) => {
                  const completionPct = computeProfileCompletion(biz);
                  const setupState = getSetupState(completionPct);
                  return (
                    <tr key={biz.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Logo and Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {biz.logoUrl ? (
                            <img 
                              src={biz.logoUrl} 
                              alt={biz.name} 
                              className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm" 
                            />
                          ) : (
                            <div className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl text-[#073afe]">
                              <Store size={18} />
                            </div>
                          )}
                          <div>
                            <strong className="block text-slate-900 font-bold">{biz.name}</strong>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{biz.phone || 'No phone'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Code and Category */}
                      <td className="px-6 py-4">
                        <div className="font-mono font-medium text-slate-600">{biz.businessCode}</div>
                        <span className="inline-block px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-md text-[9px] font-bold uppercase tracking-wider mt-1">
                          {biz.category || biz.industry}
                        </span>
                      </td>

                      {/* Setup Progress */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className="text-slate-500">{setupState.label}</span>
                            <span className="text-[#073afe]">{completionPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                completionPct < 50 ? 'bg-rose-500' : completionPct < 85 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${completionPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Onboarded Rep */}
                      <td className="px-6 py-4 text-slate-550 font-medium">
                        {biz.createdByRep?.name || <span className="text-slate-350 italic">Super Admin</span>}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                          biz.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                            : biz.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-250'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {biz.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setViewingBusiness(biz)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-[10px] shadow-sm transition-all"
                        >
                          Profile Details
                        </button>
                        
                        <Link
                          href={`/dashboard/business?businessId=${biz.id}&readOnly=true`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-[#073afe] font-bold text-[10px] shadow-sm transition-all"
                        >
                          <ExternalLink size={10} />
                          <span>Portal Dashboard</span>
                        </Link>

                        <button
                          onClick={() => handleToggleStatus(biz)}
                          className={`inline-flex items-center px-2.5 py-1.5 border rounded-xl font-bold text-[10px] shadow-sm transition-all ${
                            biz.status === 'ACTIVE'
                              ? 'bg-rose-50 hover:bg-rose-100/70 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {biz.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>

                        <button
                          onClick={() => openDeleteModal(biz)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-rose-200 bg-rose-55 hover:bg-rose-100/80 text-rose-700 font-bold text-[10px] shadow-sm rounded-xl transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Onboard Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100/60 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Store size={16} className="text-[#073afe]" />
                {isEditing ? 'Edit Business Details' : 'Onboard Client Business'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl border border-slate-200/60 bg-white hover:bg-slate-100 text-slate-400"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleOnboardSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5 text-xs">
                {formError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/50 text-rose-750 font-bold">
                    {formError}
                  </div>
                )}

                {/* Logo Upload Widget */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Logo</span>
                  <div className="flex items-center space-x-4">
                    {logoPreview ? (
                      <div className="relative h-14 w-14 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0 bg-slate-50">
                        <img src={logoPreview} alt="Preview" className="h-full w-full object-cover" />
                        {logoUploading && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <Loader2 className="animate-spin h-4 w-4 text-[#073afe]" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50 flex-shrink-0">
                        <ImageIcon size={18} />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="logo-upload"
                        className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-sm inline-block"
                      >
                        Upload Logo Image
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG or SVG formats. Square recommended.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Name</label>
                    <input
                      type="text"
                      name="username"
                      autoComplete="username"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Bella Italia"
                      className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                    <input
                      type="text"
                      name="category"
                      autoComplete="off"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Italian Restaurant, Salon"
                      className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Direct Access Password</label>
                    <input
                      type="password"
                      name="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Dashboard password"
                      className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Industry Type</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value as any })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white"
                    >
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="CAFE">Cafe</option>
                      <option value="SALON">Salon</option>
                      <option value="RESORT">Resort</option>
                      <option value="HOTEL">Hotel</option>
                      <option value="CLINIC">Clinic</option>
                      <option value="GYM">Gym</option>
                      <option value="SPA">Spa</option>
                      <option value="RETAIL_STORE">Retail Store</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description of the client business"
                    rows={3}
                    className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contact Number (Phone)</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +1 555-1234"
                      className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 100 Main Street, New York"
                    className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://clientwebsite.com"
                      className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Google Maps URL</label>
                    <input
                      type="url"
                      value={formData.googleMapsUrl}
                      onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                      placeholder="https://maps.google.com/?cid=..."
                      className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Google Review URL</label>
                  <input
                    type="url"
                    value={formData.googleReviewUrl}
                    onChange={(e) => handleGoogleUrlChange(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                  />
                  {googleUrlWarning && (
                    <div className="mt-2 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle size={11} />
                      <span>{googleUrlWarning}</span>
                    </div>
                  )}
                </div>

                {/* Notification Settings section */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 font-sans">Notification Settings</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">WhatsApp Number</label>
                      <input
                        type="text"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        placeholder="e.g. +1234567890"
                        className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Timezone</label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">EST (America/New_York)</option>
                        <option value="Europe/London">GMT/BST (Europe/London)</option>
                        <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                        <option value="Asia/Singapore">SGT (Asia/Singapore)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quiet Hours Start</label>
                      <input
                        type="time"
                        value={formData.quietHoursStart}
                        onChange={(e) => setFormData({ ...formData, quietHoursStart: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quiet Hours End</label>
                      <input
                        type="time"
                        value={formData.quietHoursEnd}
                        onChange={(e) => setFormData({ ...formData, quietHoursEnd: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                      <div className="space-y-0.5">
                        <strong className="text-slate-800 font-bold block">WhatsApp Notifications</strong>
                        <span className="text-[10px] text-slate-400">Dispatch alerts to target WhatsApp number.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.whatsappEnabled}
                        onChange={(e) => setFormData({ ...formData, whatsappEnabled: e.target.checked })}
                        className="h-4 w-4 text-[#073afe] border-slate-300 rounded focus:ring-[#073afe] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                      <div className="space-y-0.5">
                        <strong className="text-slate-800 font-bold block">Negative Reviews</strong>
                        <span className="text-[10px] text-slate-400">Trigger alerts when rating is below 4 stars.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.negativeReviewEnabled}
                        onChange={(e) => setFormData({ ...formData, negativeReviewEnabled: e.target.checked })}
                        className="h-4 w-4 text-[#073afe] border-slate-300 rounded focus:ring-[#073afe] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subscription Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white"
                  >
                    <option value="TRIAL_14">Trial (14 days)</option>
                    <option value="TRIAL_28">Trial (28 days)</option>
                    <option value="UNLIMITED">Unlimited Plan</option>
                  </select>
                </div>

                {/* QR Code Assignment */}
                {!isEditing && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Assign QR Code
                    </label>
                    <select
                      value={selectedQrCode}
                      onChange={(e) => setSelectedQrCode(e.target.value)}
                      disabled={freeQrsLoading}
                      className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-white disabled:opacity-60"
                    >
                      <option value="">⚡ Auto-assign next available QR</option>
                      {freeQrsLoading && <option disabled>Loading QR codes...</option>}
                      {freeQrs.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                      {!freeQrsLoading && freeQrs.length === 0 && (
                        <option disabled>No free QR codes available</option>
                      )}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Leave as Auto-assign to automatically pick the next free QR code.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100/60 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || logoUploading}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#073afe] text-white font-bold rounded-2xl shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center gap-1 border-none cursor-pointer"
                >
                  {submitting && <Loader2 className="animate-spin h-3.5 w-3.5" />}
                  <span>{isEditing ? 'Save Changes' : 'Create & Onboard'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Business Details Drawer / Side Panel */}
      {viewingBusiness && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white max-w-lg w-full h-full shadow-2xl flex flex-col animate-slideRight">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-3">
                {viewingBusiness.logoUrl ? (
                  <img src={viewingBusiness.logoUrl} alt={viewingBusiness.name} className="w-11 h-11 rounded-xl object-cover border border-slate-200" />
                ) : (
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-[#073afe]">
                    <Store size={20} />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-sans">{viewingBusiness.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{viewingBusiness.businessCode}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditModal(viewingBusiness)}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-[10px] flex items-center gap-1 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => setViewingBusiness(null)}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-450"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable details */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 text-xs text-slate-600">
              {qrActionMsg && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-[#073afe] font-bold">
                  {qrActionMsg}
                </div>
              )}

              {/* Progress & Setup State */}
              <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Setup Progress</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${getSetupState(computeProfileCompletion(viewingBusiness)).color}`}>
                    {getSetupState(computeProfileCompletion(viewingBusiness)).label}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>Profile Completion</span>
                    <span className="text-[#073afe]">{computeProfileCompletion(viewingBusiness)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        computeProfileCompletion(viewingBusiness) < 50 ? 'bg-rose-500' : computeProfileCompletion(viewingBusiness) < 85 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${computeProfileCompletion(viewingBusiness)}%` }}
                    />
                  </div>
                </div>

                {/* Completion breakdown list */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-450 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1">
                    {viewingBusiness.name ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-rose-500" />}
                    <span>Name (10%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {viewingBusiness.logoUrl ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-rose-500" />}
                    <span>Logo (15%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {viewingBusiness.description ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-rose-500" />}
                    <span>Description (15%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {viewingBusiness.contactPerson ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-rose-500" />}
                    <span>Contact Person (10%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {viewingBusiness.phone ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-rose-500" />}
                    <span>Phone (10%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {viewingBusiness.address ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-rose-500" />}
                    <span>Address (10%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {viewingBusiness.googleReviewUrl ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-rose-500" />}
                    <span>Google Link (10%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {viewingBusiness.category ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-rose-500" />}
                    <span>Category (10%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {viewingBusiness.website ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-rose-500" />}
                    <span>Website (5%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {viewingBusiness.googleMapsUrl ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-rose-500" />}
                    <span>Google Maps (5%)</span>
                  </div>
                </div>
              </div>

              {/* Core Profile */}
              <div className="space-y-4">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">Corporate Details</h4>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Description</span>
                    <p className="text-xs text-slate-800 font-medium mt-0.5 leading-relaxed">{viewingBusiness.description || 'No description provided.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Category</span>
                      <strong className="text-slate-850 mt-0.5 block">{viewingBusiness.category || viewingBusiness.industry}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Website</span>
                      {viewingBusiness.website ? (
                        <a href={viewingBusiness.website} target="_blank" rel="noreferrer" className="text-[#073afe] font-semibold hover:underline flex items-center gap-0.5 mt-0.5">
                          {viewingBusiness.website.replace(/^https?:\/\//i, '')} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-slate-400 mt-0.5 block">Not specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="space-y-4">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">Contact Information</h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Contact Person</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <User size={12} className="text-slate-400" />
                        <strong className="text-slate-800">{viewingBusiness.contactPerson || 'None'}</strong>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Contact Number</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Phone size={12} className="text-slate-400" />
                        <span className="text-slate-855 font-semibold">{viewingBusiness.phone || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Corporate Address</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={12} className="text-slate-400" />
                      <span className="text-slate-700 font-semibold">{viewingBusiness.address || 'None'}</span>
                    </div>
                  </div>

                  {viewingBusiness.googleMapsUrl && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Google Maps Link</span>
                      <a href={viewingBusiness.googleMapsUrl} target="_blank" rel="noreferrer" className="text-[#073afe] font-semibold hover:underline flex items-center gap-0.5 mt-0.5">
                        Open on Google Maps <Map size={10} />
                      </a>
                    </div>
                  )}
                  </div>
                </div>

              {/* Notification Configuration */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest font-sans">Notification Configuration</h4>
                  {viewingBusiness && (
                    <button
                      onClick={() => { setViewingBusiness(null); openEditModal(viewingBusiness); }}
                      className="text-[10px] font-bold text-[#073afe] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Edit Config
                    </button>
                  )}
                </div>
                
                {viewingBusiness.whatsappNumber ? (
                  <div className="space-y-3.5 bg-slate-50/40 p-4.5 border border-slate-100 rounded-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">WhatsApp Number</span>
                        <strong className="text-slate-800 mt-0.5 block">{viewingBusiness.whatsappNumber}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">WhatsApp Alerts</span>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 ${
                          viewingBusiness.notificationSettings?.whatsappEnabled 
                            ? 'text-emerald-600 bg-emerald-50' 
                            : 'text-slate-500 bg-slate-100'
                        }`}>
                          {viewingBusiness.notificationSettings?.whatsappEnabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Notification Preferences</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${viewingBusiness.notificationSettings?.negativeReviewEnabled ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                          Negative: {viewingBusiness.notificationSettings?.negativeReviewEnabled ? 'ON' : 'OFF'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${viewingBusiness.notificationSettings?.positiveReviewEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                          Positive: {viewingBusiness.notificationSettings?.positiveReviewEnabled ? 'ON' : 'OFF'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${viewingBusiness.notificationSettings?.dailySummaryEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                          Daily Report: {viewingBusiness.notificationSettings?.dailySummaryEnabled ? 'ON' : 'OFF'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${viewingBusiness.notificationSettings?.weeklySummaryEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                          Weekly Report: {viewingBusiness.notificationSettings?.weeklySummaryEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Quiet Hours</span>
                        <strong className="text-slate-800 mt-0.5 block">
                          {viewingBusiness.notificationSettings?.quietHoursStart && viewingBusiness.notificationSettings?.quietHoursEnd
                            ? `${viewingBusiness.notificationSettings.quietHoursStart} to ${viewingBusiness.notificationSettings.quietHoursEnd}`
                            : 'None'
                          }
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Timezone</span>
                        <strong className="text-slate-800 mt-0.5 block">{viewingBusiness.notificationSettings?.timezone || 'UTC'}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Total Alerts Sent</span>
                        <strong className="text-slate-800 mt-0.5 block">{(viewingBusiness as any).notificationStats?.totalNotifications ?? 0}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Success Rate</span>
                        <strong className="text-slate-850 mt-0.5 block">{(viewingBusiness as any).notificationStats?.successRate ?? 100}%</strong>
                      </div>
                    </div>

                    {((viewingBusiness as any).notificationStats?.lastNotificationSent) && (
                      <div className="text-[9px] text-slate-400 font-medium pt-0.5">
                        Last Sent: {new Date((viewingBusiness as any).notificationStats.lastNotificationSent).toLocaleString()}
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <span className="text-[10px] text-slate-400 font-medium block">Recent Notifications</span>
                      {loadingRecentJobs ? (
                        <div className="py-2 flex items-center justify-center gap-1.5">
                          <Loader2 className="animate-spin h-3.5 w-3.5 text-[#073afe]" />
                          <span className="text-[10px] text-slate-400">Loading alerts...</span>
                        </div>
                      ) : recentJobs.length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic block mt-0.5">No notifications dispatched yet.</span>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          {recentJobs.map(job => (
                            <div key={job.id} className="flex justify-between items-center bg-slate-50/50 p-2 border border-slate-100 rounded-xl text-[10px]">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-700">{job.recipient}</span>
                                <span className="block text-[9px] text-slate-450 font-semibold">{new Date(job.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <span className={`px-1.5 py-0.2 rounded-md font-bold text-[8px] border ${
                                job.status === 'SENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                job.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-center">
                    <strong className="text-rose-600 font-bold block text-xs">Setup Incomplete</strong>
                    <p className="text-[10px] text-slate-500 mt-1">This business has not completed their notification settings setup yet.</p>
                  </div>
                )}
              </div>

              {/* QR Code and Reputation Portal Asset */}
              <div className="space-y-4">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">QR Code Portal Settings</h4>
                
                <div className="space-y-4">
                  {/* Google link */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Google Reviews URL</span>
                    <a href={viewingBusiness.googleReviewUrl || '#'} target="_blank" rel="noreferrer" className="text-[#073afe] font-semibold hover:underline flex items-center gap-0.5 mt-0.5 truncate max-w-sm">
                      {viewingBusiness.googleReviewUrl || 'None'} <ExternalLink size={10} />
                    </a>
                  </div>

                  {/* Active QR code display */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active QR ID</span>
                      <strong className="font-mono text-slate-800 mt-1 block">
                        {viewingBusiness.qrAssets?.find(q => q.status === 'ASSIGNED')?.qrCode || 'NO_QR_GENERATED'}
                      </strong>
                      <span className="inline-block mt-2 text-[9px] font-bold text-slate-400">
                        Status: 
                        <span className={`ml-1 uppercase ${
                          viewingBusiness.qrAssets?.find(q => q.status === 'ASSIGNED') ? 'text-emerald-600 font-extrabold' : 'text-rose-500 font-bold'
                        }`}>
                          {viewingBusiness.qrAssets?.find(q => q.status === 'ASSIGNED') ? 'Active' : 'Not Generated'}
                        </span>
                      </span>
                    </div>

                    {!viewingBusiness.qrAssets?.find(q => q.status === 'ASSIGNED') && (
                      <button
                        onClick={() => handleGenerateQr(viewingBusiness.id)}
                        disabled={qrGenerating}
                        className="px-3 py-2 bg-gradient-to-r from-blue-600 to-[#073afe] text-white font-bold rounded-xl shadow-sm text-[10px] disabled:opacity-50 border-none cursor-pointer"
                      >
                        {qrGenerating ? 'Generating...' : 'Generate QR'}
                      </button>
                    )}
                  </div>

                  {/* Download stats and actions */}
                  {viewingBusiness.qrAssets?.find(q => q.status === 'ASSIGNED') && (
                    <div className="p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-indigo-750">
                        <span>QR Download Analytics</span>
                        <span>{viewingBusiness.totalDownloads || 0} Downloads</span>
                      </div>

                      {viewingBusiness.lastDownloadDate && (
                        <p className="text-[9px] text-slate-400 mt-1">
                          Last Download: {new Date(viewingBusiness.lastDownloadDate).toLocaleString()}
                        </p>
                      )}

                      <button
                        onClick={() => handleDownloadBrandedSheet(viewingBusiness)}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white font-bold rounded-xl shadow-sm text-center flex items-center justify-center gap-1.5 border-none cursor-pointer mt-2"
                      >
                        <Download size={12} />
                        <span>Download Branded Printable Sheet (PDF)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingBusiness(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && businessToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <AlertTriangle size={24} />
                <h3 className="font-bold text-base text-slate-900">Delete Client Business</h3>
              </div>
              
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Are you sure you want to delete <strong className="text-slate-900">{businessToDelete.name}</strong>?
                This action is permanent and will soft-delete the business and revoke all its active QR codes.
              </p>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm cursor-pointer border-none"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
