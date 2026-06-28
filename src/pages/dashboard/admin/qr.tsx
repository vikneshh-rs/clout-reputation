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
  Calendar
} from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

interface QRRecord {
  id: string;
  qrCode: string;
  status: 'ACTIVE' | 'ARCHIVED';
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
  createdAt: string;
}

interface QRStats {
  total: number;
  active: number;
  archived: number;
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

  // Filter State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/super-admin/inventory?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
        setStats(data.stats || null);
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
  }, [user, statusFilter, searchQuery]);

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
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [105, 148] // A6 flyer size
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
        nameLines = doc.splitTextToSize(businessName, maxTextWidth);
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
      const targetUrl = `${window.location.origin}/r/${slug || code}`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 400, margin: 1 });
      doc.addImage(qrDataUrl, 'PNG', 14.5, 38, 76, 76);

      // 4. "Scan to Review" centered in Helvetica-Bold (sans-serif, size 16pt, neutral gray `#4B5563`)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(75, 85, 99); // #4B5563
      doc.text('Scan to Review', width / 2, 132, { align: 'center' });

      // Save PDF
      doc.save(`${businessName.replace(/\s+/g, '_')}_Review_Sheet.pdf`);
      setSuccess(`Downloaded branded PDF sheet for ${businessName}.`);

      // Log download to ActivityLog
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
    <DashboardLayout title="QR Assets Management" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>QR Assets - Cloutation</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">System QR Assets</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track and download branded review portals and codes.</p>
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

      {/* Stats row */}
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
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active QRs</span>
              <span className="block text-2xl font-extrabold text-emerald-650 mt-1">{stats.active}</span>
            </div>
            <div className="p-3 bg-emerald-50/70 text-emerald-650 rounded-2xl">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md border border-slate-100/60 p-6 rounded-3xl flex justify-between items-center shadow-[0_8px_30px_rgba(15,23,42,0.015)]">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archived QRs</span>
              <span className="block text-2xl font-extrabold text-slate-400 mt-1">{stats.archived}</span>
            </div>
            <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-100/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.015)]">
        {/* Filters */}
        <div className="p-6 border-b border-slate-100/60 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Building2 size={16} className="text-[#073afe]" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-sans">Assets List</h4>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:flex-grow-0">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={13} className="text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search business or code..."
                className="pl-9 pr-3 py-1.5 w-full sm:w-56 text-xs border border-slate-200 rounded-xl bg-white/60 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-700 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading && inventory.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-6 w-6 text-[#073afe] mx-auto mb-2.5" />
              <span className="text-xs text-slate-400 font-medium">Loading QR assets...</span>
            </div>
          ) : inventory.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No QR assets match the selected filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-sans">
              <thead className="bg-slate-50/50 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Business</th>
                  <th className="px-6 py-3">Representative</th>
                  <th className="px-6 py-3">QR Status</th>
                  <th className="px-6 py-3">Created Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent">
                {inventory.map((qr) => (
                  <tr key={qr.id} className="hover:bg-slate-50/30 transition-colors">
                    {/* Business Name and Logo */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {qr.business?.logoUrl ? (
                          <img 
                            src={qr.business.logoUrl} 
                            alt={qr.business.name} 
                            className="w-9 h-9 rounded-xl object-cover border border-slate-100" 
                          />
                        ) : (
                          <div className="p-2 bg-slate-50 border border-slate-200/50 rounded-xl text-[#073afe]">
                            <Building2 size={16} />
                          </div>
                        )}
                        <div>
                          <strong className="block text-slate-900 font-bold">{qr.business?.name || 'Unassigned'}</strong>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{qr.qrCode}</span>
                        </div>
                      </div>
                    </td>

                    {/* Representative */}
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-slate-400" />
                        <span>{qr.rep?.name || qr.business?.createdByRep?.name || 'System'}</span>
                      </div>
                    </td>

                    {/* QR Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                        qr.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {qr.status}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{new Date(qr.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {qr.business ? (
                        <button
                          onClick={() => downloadBrandedSheet(qr)}
                          disabled={downloadingId === qr.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-[#073afe] font-bold text-[10px] active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                          title="Download Printable Review Sheet"
                        >
                          {downloadingId === qr.id ? (
                            <Loader2 className="animate-spin h-3 w-3" />
                          ) : (
                            <Download size={11} />
                          )}
                          <span>Printable Sheet</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 italic text-[10px]">No Business</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
