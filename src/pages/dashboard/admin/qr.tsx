import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  QrCode, 
  Search, 
  Download, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  Building2,
  Users,
  Calendar,
  Layers,
  Plus,
  RefreshCw,
  X,
  Link,
  Trash2
} from 'lucide-react';

interface QRRecord {
  id: string;
  qrCode: string;
  status: 'ASSIGNED' | 'FREE';
  assignedBusinessId: string | null;
  assignedDate: string | null;
  assignedBy: string | null;
  revokedDate: string | null;
  createdAt: string;
  business?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    createdByRep?: {
      name: string;
    } | null;
  } | null;
  rep?: {
    name: string;
  } | null;
}

interface QRStats {
  total: number;
  active: number; // mapped to assigned
  free: number;
}

interface BusinessListItem {
  id: string;
  name: string;
  assignedQrAssetId: string | null;
}

export default function QrAssetsPage(props: any) {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  // State
  const [inventory, setInventory] = useState<QRRecord[]>([]);
  const [stats, setStats] = useState<QRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Tabs: 'ASSIGNED' | 'FREE'
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'FREE'>('ASSIGNED');

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingQrCode, setDeletingQrCode] = useState<string | null>(null);
  const [deletingQrStatus, setDeletingQrStatus] = useState<'ASSIGNED' | 'FREE' | null>(null);
  const [deletingBusinessName, setDeletingBusinessName] = useState('');
  const [deletingQr, setDeletingQr] = useState(false);

  // Form states
  const [prefixInput, setPrefixInput] = useState('A');
  const [startNumInput, setStartNumInput] = useState('1');
  const [endNumInput, setEndNumInput] = useState('10');
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);
  const [targetBusinessName, setTargetBusinessName] = useState('');
  const [revokingQr, setRevokingQr] = useState(false);

  const [businessesList, setBusinessesList] = useState<BusinessListItem[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [assigningQr, setAssigningQr] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`/api/super-admin/inventory`);
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
        // Map stats fields
        setStats({
          total: data.stats?.total || 0,
          active: data.stats?.active || 0, // Assigned count
          free: data.stats?.free || 0 // Free count
        });
      } else {
        setError('Failed to fetch QR assets.');
      }
    } catch (err) {
      setError('Network error fetching QR assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchInventory();
    }
  }, [user]);

  // Reset pagination on tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Filtered inventory based on tab and search query
  const filteredInventory = inventory.filter(qr => {
    const matchesTab = qr.status === activeTab;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      qr.qrCode.toLowerCase().includes(query) ||
      (qr.business?.name || '').toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  // Paginated elements
  const totalItems = filteredInventory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Generate Links Submission
  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingBatch(true);
      setError('');
      setSuccess('');

      const start = parseInt(startNumInput, 10);
      const end = parseInt(endNumInput, 10);

      if (!prefixInput.trim() || isNaN(start) || isNaN(end) || end < start) {
        setError('Please enter a valid prefix and number range (End must be >= Start).');
        setSubmittingBatch(false);
        return;
      }

      const res = await fetch('/api/super-admin/generate-qr-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: prefixInput,
          startNumber: start,
          endNumber: end
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Successfully generated ${end - start + 1} QR codes.`);
        setIsGenerateModalOpen(false);
        fetchInventory();
      } else {
        setError(data.error || 'Failed to generate QR codes.');
      }
    } catch (err) {
      setError('Network error generating QR codes.');
    } finally {
      setSubmittingBatch(false);
    }
  };

  // Deletion Modal Trigger
  const openDeleteModal = (qrCode: string, status: 'ASSIGNED' | 'FREE', bizName = '') => {
    setDeletingQrCode(qrCode);
    setDeletingQrStatus(status);
    setDeletingBusinessName(bizName);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingQrCode) return;
    try {
      setDeletingQr(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/super-admin/delete-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: deletingQrCode })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Successfully deleted QR Code ${deletingQrCode}.`);
        setIsDeleteModalOpen(false);
        fetchInventory();
      } else {
        setError(data.error || 'Failed to delete QR code.');
      }
    } catch (err) {
      setError('Network error deleting QR code.');
    } finally {
      setDeletingQr(false);
    }
  };

  // Revocation Modal Trigger
  const openRevokeModal = (qrCode: string, bizName: string) => {
    setSelectedQrCode(qrCode);
    setTargetBusinessName(bizName);
    setIsRevokeModalOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!selectedQrCode) return;
    try {
      setRevokingQr(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/super-admin/revoke-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: selectedQrCode })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Successfully revoked QR Code ${selectedQrCode}.`);
        setIsRevokeModalOpen(false);
        fetchInventory();
      } else {
        setError(data.error || 'Failed to revoke QR code.');
      }
    } catch (err) {
      setError('Network error revoking QR code.');
    } finally {
      setRevokingQr(false);
    }
  };

  // Assignment Modal Trigger
  const openAssignModal = async (qrCode: string) => {
    setSelectedQrCode(qrCode);
    setIsAssignModalOpen(true);
    setLoadingBusinesses(true);
    setSelectedBusinessId('');
    try {
      const res = await fetch('/api/super-admin/businesses');
      if (res.ok) {
        const data = await res.json();
        // Filter businesses without active QR asset
        const unassigned = data.filter((b: any) => !b.assignedQrAssetId && (!b.qrAssets || b.qrAssets.length === 0));
        setBusinessesList(unassigned);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const handleAssignConfirm = async () => {
    if (!selectedQrCode || !selectedBusinessId) return;
    try {
      setAssigningQr(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/rep/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          qrCode: selectedQrCode,
          businessId: selectedBusinessId
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Successfully assigned QR Code ${selectedQrCode} to business.`);
        setIsAssignModalOpen(false);
        fetchInventory();
      } else {
        setError(data.error || 'Failed to assign QR code.');
      }
    } catch (err) {
      setError('Network error assigning QR code.');
    } finally {
      setAssigningQr(false);
    }
  };

  const downloadBrandedSheet = async (qr: QRRecord) => {
    if (!qr.business) return;
    const businessId = qr.business.id;
    const businessName = qr.business.name;
    const logoUrl = qr.business.logoUrl;
    const slug = qr.business.slug;
    const code = qr.qrCode;

    try {
      setDownloadingId(qr.id);
      setError('');
      
      const { jsPDF } = await import('jspdf');
      const QRCode = (await import('qrcode')).default;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [105, 148]
      });

      const width = 105;
      const height = 148;

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.roundedRect(6, 6, width - 12, height - 12, 5, 5, 'S');

      let fontFamily = 'times';
      doc.setFont(fontFamily, 'bold');
      
      let fontSize = 24;
      let nameLines: string[] = [];
      const maxTextWidth = 85;
      
      while (fontSize >= 14) {
        doc.setFontSize(fontSize);
        nameLines = doc.splitTextToSize(businessName, maxTextWidth);
        const lineHeightInMm = fontSize * 1.15 * 0.3528;
        const totalHeight = nameLines.length * lineHeightInMm;
        if (totalHeight <= 18 || fontSize === 14) {
          break;
        }
        fontSize -= 2;
      }

      const lineHeightInMm = fontSize * 1.15 * 0.3528;
      const yStart = 22 - ((nameLines.length - 1) * lineHeightInMm / 2);
      
      doc.setTextColor(17, 24, 39);
      doc.text(nameLines, width / 2, yStart, { align: 'center' });

      // Resolve URL format using absolute cqr identifier
      const targetUrl = `${window.location.origin}/r/${code}`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 400, margin: 1 });
      doc.addImage(qrDataUrl, 'PNG', 14.5, 38, 76, 76);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(75, 85, 99);
      doc.text('Scan to Review', width / 2, 132, { align: 'center' });

      doc.save(`${businessName.replace(/\s+/g, '_')}_Review_Sheet.pdf`);
      setSuccess(`Downloaded branded PDF sheet for ${businessName}.`);

      await fetch('/api/business/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });

    } catch (err) {
      console.error(err);
      setError('Error generating branded PDF review sheet.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <Loader2 className="animate-spin h-8 w-8 text-[#073afe]" />
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-1">Super Admin permissions required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="QR Assets Inventory" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>QR Asset Management - Cloutation</title>
      </Head>

      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">QR Asset Inventory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage reusable, permanent QR code assets for all businesses.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchInventory(); setSuccess('Inventory refreshed.'); }}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            title="Refresh Inventory"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#073afe] text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>Generate Links</span>
          </button>
        </div>
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

      {/* Stats block */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 animate-fadeIn">
          <div className="bg-white/80 backdrop-blur-md border border-slate-100/60 p-6 rounded-3xl flex justify-between items-center shadow-[0_8px_30px_rgba(15,23,42,0.015)]">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total QR Assets</span>
              <span className="block text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</span>
            </div>
            <div className="p-3 bg-blue-50/70 text-[#073afe] rounded-2xl">
              <QrCode size={20} />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md border border-slate-100/60 p-6 rounded-3xl flex justify-between items-center shadow-[0_8px_30px_rgba(15,23,42,0.015)]">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Assets</span>
              <span className="block text-2xl font-extrabold text-emerald-650 mt-1">{stats.active}</span>
            </div>
            <div className="p-3 bg-emerald-50/70 text-emerald-650 rounded-2xl">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md border border-slate-100/60 p-6 rounded-3xl flex justify-between items-center shadow-[0_8px_30px_rgba(15,23,42,0.015)]">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Free (Available)</span>
              <span className="block text-2xl font-extrabold text-indigo-600 mt-1">{stats.free}</span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Layers size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex border-b border-slate-100 mb-6">
        <button
          onClick={() => setActiveTab('ASSIGNED')}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'ASSIGNED'
              ? 'border-[#073afe] text-[#073afe]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Assigned ({stats?.active || 0})
        </button>
        <button
          onClick={() => setActiveTab('FREE')}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'FREE'
              ? 'border-[#073afe] text-[#073afe]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Free / Available ({stats?.free || 0})
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-100/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.015)] mb-8">
        {/* Filters */}
        <div className="p-6 border-b border-slate-100/60 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Building2 size={16} className="text-[#073afe]" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-sans">
              {activeTab === 'ASSIGNED' ? 'Assigned Assets' : 'Available QR Inventory'}
            </h4>
          </div>

          <div className="relative w-full sm:w-auto">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={13} className="text-slate-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code or business..."
              className="pl-9 pr-3 py-1.5 w-full sm:w-64 text-xs border border-slate-200 rounded-xl bg-white/60 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          {loading && inventory.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-6 w-6 text-[#073afe] mx-auto mb-2.5" />
              <span className="text-xs text-slate-400 font-medium">Loading assets...</span>
            </div>
          ) : paginatedInventory.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No QR assets match the filters in this view.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-sans">
              <thead className="bg-slate-50/50 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-100">
                {activeTab === 'ASSIGNED' ? (
                  <tr>
                    <th className="px-6 py-3">QR ID</th>
                    <th className="px-6 py-3">Assigned Business</th>
                    <th className="px-6 py-3">Assigned Date</th>
                    <th className="px-6 py-3">Assigned By</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-3">QR ID</th>
                    <th className="px-6 py-3">Created Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent">
                {paginatedInventory.map((qr) => (
                  <tr key={qr.id} className="hover:bg-slate-50/30 transition-colors">
                    {/* QR ID */}
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <QrCode size={14} className="text-[#073afe] opacity-80" />
                        <span>{qr.qrCode}</span>
                      </div>
                    </td>

                    {activeTab === 'ASSIGNED' ? (
                      <>
                        {/* Business Name and Logo */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {qr.business?.logoUrl ? (
                              <img 
                                src={qr.business.logoUrl} 
                                alt={qr.business.name} 
                                className="w-8 h-8 rounded-xl object-cover border border-slate-100" 
                              />
                            ) : (
                              <div className="p-2 bg-slate-50 border border-slate-200/50 rounded-xl text-slate-400">
                                <Building2 size={13} />
                              </div>
                            )}
                            <div>
                              <strong className="block text-slate-900 font-bold">{qr.business?.name}</strong>
                              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">/r/{qr.qrCode}</span>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Date */}
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-400" />
                            <span>{qr.assignedDate ? new Date(qr.assignedDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>

                        {/* Assigned By */}
                        <td className="px-6 py-4 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Users size={12} className="text-slate-400" />
                            <span>{qr.rep?.name || qr.business?.createdByRep?.name || 'System'}</span>
                          </div>
                        </td>

                        {/* Actions for ASSIGNED */}
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex gap-2 items-center">
                            <button
                              onClick={() => downloadBrandedSheet(qr)}
                              disabled={downloadingId === qr.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-[10px] active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                            >
                              {downloadingId === qr.id ? (
                                <Loader2 className="animate-spin h-3 w-3" />
                              ) : (
                                <Download size={11} />
                              )}
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => openRevokeModal(qr.qrCode, qr.business?.name || '')}
                              className="px-2.5 py-1.5 bg-rose-50 border border-rose-250 text-rose-600 rounded-xl hover:bg-rose-100 font-bold text-[10px] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                            >
                              Revoke
                            </button>
                            <button
                              onClick={() => openDeleteModal(qr.qrCode, 'ASSIGNED', qr.business?.name || '')}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-colors cursor-pointer"
                              title="Delete QR"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Created Date */}
                        <td className="px-6 py-4 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-400" />
                            <span>{new Date(qr.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>

                        {/* Status (FREE) */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider bg-indigo-50 text-indigo-700 border-indigo-200">
                            Available
                          </span>
                        </td>

                        {/* Actions for FREE */}
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex gap-2 items-center justify-end">
                            <button
                              onClick={() => openAssignModal(qr.qrCode)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#073afe] text-white border border-[#073afe] rounded-xl hover:bg-blue-700 font-bold text-[10px] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                            >
                              <Link size={10} />
                              <span>Assign to Business</span>
                            </button>
                            <button
                              onClick={() => openDeleteModal(qr.qrCode, 'FREE')}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-colors cursor-pointer"
                              title="Delete QR"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100/60 flex items-center justify-between font-sans">
            <span className="text-xs text-slate-400 font-medium">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItems} total items)
            </span>
            <div className="inline-flex gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* modal - GENERATE LINKS */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
          <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <QrCode className="text-[#073afe] h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">Generate QR Assets</h3>
                </div>
                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="p-1.5 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleGenerateBatch}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Prefix Letter</label>
                    <input
                      type="text"
                      value={prefixInput}
                      onChange={(e) => setPrefixInput(e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase())}
                      placeholder="e.g. A, B"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-800 font-semibold"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Single uppercase letter defining the code range prefix (e.g. A creates cqr-A001).</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Number</label>
                      <input
                        type="number"
                        min="1"
                        value={startNumInput}
                        onChange={(e) => setStartNumInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-800 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Number</label>
                      <input
                        type="number"
                        min="1"
                        value={endNumInput}
                        onChange={(e) => setEndNumInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-800 font-semibold"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBatch}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#073afe] text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm"
                  >
                    {submittingBatch ? (
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                    ) : (
                      <span>Generate</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* modal - CONFIRM REVOCATION */}
      {isRevokeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
          <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn p-6">
              <div className="flex items-center space-x-3 mb-4 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-base font-bold">Revoke QR Assignment?</h3>
              </div>

              <div className="text-xs text-slate-500 space-y-2 mb-6 leading-relaxed">
                <p>Are you sure you want to revoke the QR asset assignment?</p>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 font-semibold text-slate-800">
                  <div className="flex justify-between">
                    <span>QR Code:</span>
                    <span className="font-mono text-[#073afe]">{selectedQrCode}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Current Business:</span>
                    <span>{targetBusinessName}</span>
                  </div>
                </div>
                <p className="text-slate-400 text-[10px]">Note: The QR code will be marked as <strong className="text-slate-600">Available (FREE)</strong> for future business assignments. This action is logged in QRHistory and cannot be deleted.</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRevokeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
                >
                  No, Keep
                </button>
                <button
                  type="button"
                  onClick={handleRevokeConfirm}
                  disabled={revokingQr}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-650 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm"
                >
                  {revokingQr ? (
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                  ) : (
                    <span>Yes, Revoke</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* modal - ASSIGN FREE QR */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
          <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <Link className="text-[#073afe] h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">Assign QR to Business</h3>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-1.5 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mb-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Selected QR Code</span>
                <div className="px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl font-mono text-slate-800 font-bold text-xs">
                  {selectedQrCode}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Select Target Business</label>
                {loadingBusinesses ? (
                  <div className="py-4 text-center">
                    <Loader2 className="animate-spin h-4 w-4 text-[#073afe] mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400">Loading unassigned businesses...</span>
                  </div>
                ) : businessesList.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                    No unassigned businesses found. All active businesses already have a QR code.
                  </div>
                ) : (
                  <select
                    value={selectedBusinessId}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-800 font-semibold"
                    required
                  >
                    <option value="">-- Choose Business --</option>
                    {businessesList.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignConfirm}
                  disabled={assigningQr || !selectedBusinessId}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#073afe] text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm"
                >
                  {assigningQr ? (
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                  ) : (
                    <span>Assign Link</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* modal - CONFIRM DELETION */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans animate-fadeIn">
          <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6">
              <div className="flex items-center space-x-3 mb-4 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-base font-bold">Delete QR Asset?</h3>
              </div>

              <div className="text-xs text-slate-500 space-y-2 mb-6 leading-relaxed">
                <p>Are you sure you want to permanently delete this QR asset?</p>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 font-semibold text-slate-800">
                  <div className="flex justify-between">
                    <span>QR Code:</span>
                    <span className="font-mono text-rose-600">{deletingQrCode}</span>
                  </div>
                  {deletingQrStatus === 'ASSIGNED' && (
                    <div className="flex justify-between mt-1">
                      <span>Assigned Business:</span>
                      <span>{deletingBusinessName}</span>
                    </div>
                  )}
                </div>
                {deletingQrStatus === 'ASSIGNED' ? (
                  <p className="text-rose-500 text-[10px] font-bold">
                    Warning: This QR asset is currently active. Deleting it will immediately revoke the business assignment. Scan redirection for this code will stop working!
                  </p>
                ) : (
                  <p className="text-slate-400 text-[10px]">
                    Note: This action is permanent and cannot be undone. The QR code identifier will be deleted from the system.
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deletingQr}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm"
                >
                  {deletingQr ? (
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                  ) : (
                    <span>Yes, Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
