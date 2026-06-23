import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  QrCode, 
  Plus, 
  Search, 
  Download, 
  FileText, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  Layers,
  Database,
  Link,
  Building2
} from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

interface QRRecord {
  id: string;
  qrCode: string;
  status: 'UNASSIGNED' | 'ASSIGNED' | 'DAMAGED' | 'REPLACED' | 'INACTIVE';
  business?: {
    name: string;
  } | null;
  batch?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

interface QRBatch {
  id: string;
  name: string;
  createdAt: string;
  _count?: {
    codes: number;
  };
}

interface QRStats {
  total: number;
  unassigned: number;
  assigned: number;
  damaged: number;
  replaced: number;
  inactive: number;
}

export default function QrInventoryPage(props: any) {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  // State
  const [inventory, setInventory] = useState<QRRecord[]>([]);
  const [batches, setBatches] = useState<QRBatch[]>([]);
  const [stats, setStats] = useState<QRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [batchName, setBatchName] = useState('');
  const [startSerial, setStartSerial] = useState('QR-001000');
  const [quantity, setQuantity] = useState<number | string>('100');
  const [generating, setGenerating] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Filter State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState('ALL');

  // Assignment modal state
  const [assigningQr, setAssigningQr] = useState<QRRecord | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [businesses, setBusinesses] = useState<{ id: string; name: string; industry: string }[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  const fetchBusinesses = async () => {
    try {
      const res = await fetch('/api/super-admin/businesses');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
        if (data.businesses && data.businesses.length > 0) {
          setSelectedBusinessId(data.businesses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningQr || !selectedBusinessId) return;

    setAssignLoading(true);
    setAssignError('');

    try {
      const res = await fetch('/api/rep/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          qrCode: assigningQr.qrCode,
          businessId: selectedBusinessId
        })
      });

      if (res.ok) {
        setSuccess(`Successfully assigned QR "${assigningQr.qrCode}" to business.`);
        setAssigningQr(null);
        fetchInventory();
      } else {
        const data = await res.json();
        setAssignError(data.error || 'Failed to assign QR code.');
      }
    } catch (err) {
      setAssignError('Network error during assignment.');
    } finally {
      setAssignLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (batchFilter !== 'ALL') params.append('batchId', batchFilter);

      const res = await fetch(`/api/super-admin/inventory?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
        setStats(data.stats || null);
        setBatches(data.batches || []);
      } else {
        setError('Failed to fetch QR inventory.');
      }
    } catch (err) {
      setError('Network error fetching QR inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchInventory();
    }
  }, [user, statusFilter, searchQuery, batchFilter]);

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setError('');
    setSuccess('');

    if (!batchName.trim()) {
      setValidationError('Batch Name is required.');
      return;
    }

    if (!startSerial.trim() || !startSerial.startsWith('QR-')) {
      setValidationError('Starting QR Number must begin with "QR-" followed by numbers (e.g. QR-001000).');
      return;
    }

    const qty = parseInt(String(quantity), 10);
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      setValidationError('Batch size must be between 1 and 1000 QR codes.');
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch('/api/super-admin/generate-qr-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName,
          startSerial,
          quantity: qty
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'QR batch generated successfully.');
        setBatchName('');
        // Increment start serial for next time
        const numPart = startSerial.substring(3);
        const nextNum = parseInt(numPart, 10) + qty;
        const paddedNextNum = String(nextNum).padStart(numPart.length, '0');
        setStartSerial(`QR-${paddedNextNum}`);
        
        fetchInventory();
      } else {
        setError(data.error || 'Failed to generate QR batch.');
      }
    } catch (err) {
      setError('Network error generating batch.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadSingleQr = async (code: string) => {
    try {
      const url = `${window.location.origin}/r/${code}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${code}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to generate single QR download', err);
    }
  };

  const downloadBatchPdf = async (selectedBatchId: string, selectedBatchName: string) => {
    try {
      setError('');
      setSuccess('');
      
      // Fetch codes belonging to this batch
      const res = await fetch(`/api/super-admin/inventory?batchId=${selectedBatchId}`);
      if (!res.ok) {
        setError('Failed to fetch batch details for PDF export.');
        return;
      }
      const data = await res.json();
      const codes = (data.inventory || []).map((q: QRRecord) => q.qrCode);
      
      if (codes.length === 0) {
        setError('No QR codes found in this batch to export.');
        return;
      }

      const doc = new jsPDF();
      const margin = 10;
      const cols = 3;
      const rows = 6;
      const cardWidth = (210 - (margin * 2)) / cols; // ~63.3mm
      const cardHeight = (297 - (margin * 2)) / rows; // ~46.1mm
      
      let colIndex = 0;
      let rowIndex = 0;

      for (let i = 0; i < codes.length; i++) {
        const code = codes[i];
        const url = `${window.location.origin}/r/${code}`;
        const qrDataUrl = await QRCode.toDataURL(url, { width: 150, margin: 1 });

        if (rowIndex >= rows) {
          doc.addPage();
          rowIndex = 0;
          colIndex = 0;
        }

        const x = margin + colIndex * cardWidth;
        const y = margin + rowIndex * cardHeight;

        // Draw card border
        doc.setDrawColor(220, 220, 220);
        doc.rect(x + 2, y + 2, cardWidth - 4, cardHeight - 4);

        // Draw brand text
        doc.setTextColor(24, 87, 214); // #1857D6
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('CLOUT REPUTATION', x + cardWidth / 2, y + 10, { align: 'center' });

        // Draw QR Code
        const qrSize = 22;
        doc.addImage(qrDataUrl, 'PNG', x + (cardWidth - qrSize) / 2, y + 12, qrSize, qrSize);

        // Draw scan instruction & serial number
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Scan to Review', x + cardWidth / 2, y + 38, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(code, x + cardWidth / 2, y + 42, { align: 'center' });

        colIndex++;
        if (colIndex >= cols) {
          colIndex = 0;
          rowIndex++;
        }
      }

      doc.save(`${selectedBatchName.replace(/\s+/g, '_')}_Stickers.pdf`);
      setSuccess(`PDF sticker sheet downloaded for batch: ${selectedBatchName}`);
    } catch (err) {
      console.error(err);
      setError('Error generating PDF sticker sheets.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-['Source_Sans_Pro']">
        <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-['Source_Sans_Pro']">
        <AlertTriangle className="h-12 w-12 text-red-650 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-zinc-500 text-sm mt-1">Super Admin permissions required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="QR Inventory & Batches" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>QR Inventory & Batches - Clout Reputation</title>
        
      </Head>

      <div className="mb-6">
        <p className="text-xs text-zinc-500 mt-0.5">Generate, track, and export QR codes for business reviews.</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 text-red-750 text-xs flex items-start">
          <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-750 text-xs flex items-start">
          <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Side: Batch Generator Form */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] lg:col-span-1 h-fit">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100">
            <Plus size={16} className="text-[#1857D6]" />
            <h3 className="font-bold text-sm text-slate-900 font-sans">Generate QR Batch</h3>
          </div>

          <form onSubmit={handleGenerateBatch} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Batch Name</label>
              <input 
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g. June 2026 Batch"
                className="w-full text-xs p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Starting Serial</label>
                <input 
                  type="text"
                  value={startSerial}
                  onChange={(e) => setStartSerial(e.target.value)}
                  placeholder="e.g. QR-001000"
                  className="w-full text-xs p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Quantity</label>
                <input 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="100"
                  min="1"
                  max="1000"
                  className="w-full text-xs p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                  required
                />
              </div>
            </div>

            {validationError && (
              <p className="text-red-650 text-[11px] font-semibold">{validationError}</p>
            )}

            <button
              type="submit"
              disabled={generating}
              className="w-full py-2 bg-[#1857D6] hover:bg-[#154fc4] text-white text-xs font-semibold rounded transition-colors flex items-center justify-center space-x-2"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin h-3.5 w-3.5" />
                  <span>Generating Batch...</span>
                </>
              ) : (
                <>
                  <QrCode size={14} />
                  <span>Create Batch</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: QR Batches List & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-4 rounded-2xl text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Total QRs</span>
                <span className="block text-lg font-bold text-slate-900 mt-1">{stats.total}</span>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-4 rounded-2xl text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Unassigned</span>
                <span className="block text-lg font-bold text-zinc-600 mt-1">{stats.unassigned}</span>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-4 rounded-2xl text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Assigned</span>
                <span className="block text-lg font-bold text-[#1857D6] mt-1">{stats.assigned}</span>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-4 rounded-2xl text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Damaged/Other</span>
                <span className="block text-lg font-bold text-amber-600 mt-1">{stats.damaged + stats.replaced + stats.inactive}</span>
              </div>
            </div>
          )}

          {/* Batches PDF Export Section */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100">
              <Layers size={16} className="text-[#1857D6]" />
              <h3 className="font-bold text-sm text-slate-900 font-sans">Download Printable Sticker Sheets</h3>
            </div>
            
            {batches.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">No batches generated yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2">
                {batches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 bg-slate-50/30 border border-slate-100 rounded-xl text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 font-sans">{batch.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {batch._count?.codes || 0} QR Codes • {new Date(batch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadBatchPdf(batch.id, batch.name)}
                      className="p-1.5 bg-white border border-zinc-250 hover:bg-zinc-100 text-[#1857D6] rounded transition-colors flex items-center gap-1"
                      title="Download PDF sticker sheet"
                    >
                      <FileText size={12} />
                      <span className="text-[10px] font-semibold">PDF</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Inventory Section */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {/* Filters bar */}
        <div className="p-4 bg-slate-50/20 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database size={16} className="text-[#1857D6]" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-sans">Inventory List</h4>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:flex-grow-0">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search size={12} className="text-zinc-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code (e.g. QR-001)"
                className="pl-8 pr-3 py-1.5 w-full sm:w-48 text-xs border border-zinc-250 rounded bg-white focus:border-[#1857D6] focus:outline-none"
              />
            </div>

            {/* Batch Filter */}
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-zinc-250 rounded bg-white focus:border-[#1857D6] focus:outline-none"
            >
              <option value="ALL">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-zinc-250 rounded bg-white focus:border-[#1857D6] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="DAMAGED">Damaged</option>
              <option value="REPLACED">Replaced</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading && inventory.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-6 w-6 text-[#1857D6] mx-auto mb-2" />
              <span className="text-xs text-zinc-450">Loading QR codes...</span>
            </div>
          ) : inventory.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              No QR codes match the selected filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-zinc-150 text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-400 uppercase font-bold tracking-wider text-[10px] border-b border-zinc-150">
                <tr>
                  <th className="px-6 py-3">QR Code</th>
                  <th className="px-6 py-3">Batch Name</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Assigned Business</th>
                  <th className="px-6 py-3">Created Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 bg-white">
                {inventory.map((qr) => (
                  <tr key={qr.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-black">{qr.qrCode}</td>
                    <td className="px-6 py-3.5 text-zinc-650">{qr.batch?.name || 'N/A'}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        qr.status === 'ASSIGNED'
                          ? 'bg-blue-50 text-blue-750 border border-blue-150'
                          : qr.status === 'UNASSIGNED'
                          ? 'bg-zinc-50 text-zinc-700 border border-zinc-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {qr.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-zinc-750 font-medium">
                      {qr.business?.name || <span className="text-zinc-350 italic">None</span>}
                    </td>
                    <td className="px-6 py-3.5 text-zinc-450">
                      {new Date(qr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right flex justify-end space-x-2 items-center">
                      <button
                        onClick={() => downloadSingleQr(qr.qrCode)}
                        className="inline-flex items-center space-x-1 p-1 bg-white border border-zinc-250 rounded hover:bg-zinc-50 text-[#1857D6] font-semibold text-[10px]"
                        title="Download PNG QR image"
                      >
                        <Download size={10} />
                        <span>PNG</span>
                      </button>
                      {qr.status === 'UNASSIGNED' && (
                        <button
                          onClick={() => {
                            setAssigningQr(qr);
                            if (businesses.length === 0) {
                              fetchBusinesses();
                            }
                          }}
                          className="inline-flex items-center space-x-1 p-1 bg-white border border-zinc-250 rounded hover:bg-zinc-50 text-emerald-600 font-semibold text-[10px]"
                          title="Assign to business"
                        >
                          <Link size={10} />
                          <span>Assign</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Assignment Modal */}
        {assigningQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-50/70 text-[#1857D6] rounded-xl">
                    <Building2 size={18} />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Assign QR Code</h3>
                </div>
                <button
                  onClick={() => setAssigningQr(null)}
                  className="text-zinc-450 hover:text-black text-xs font-semibold bg-transparent border-none cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
                {assignError && (
                  <div className="p-3 bg-rose-50 border border-rose-200/50 rounded-xl text-rose-700 text-xs">
                    {assignError}
                  </div>
                )}
                
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1 font-sans">
                  <div>Sticker Code: <strong className="font-mono text-black">{assigningQr.qrCode}</strong></div>
                  <div>Status: <span className="text-zinc-550 font-bold uppercase">{assigningQr.status}</span></div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="modalBizSelect" className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
                    Select Business
                  </label>
                  <select
                    id="modalBizSelect"
                    value={selectedBusinessId}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl bg-white px-3 py-2 focus:border-[#1857D6] focus:outline-none"
                  >
                    {businesses.length === 0 ? (
                      <option value="">Loading active businesses...</option>
                    ) : (
                      businesses.map((biz) => (
                        <option key={biz.id} value={biz.id}>
                          {biz.name} ({biz.industry.replace('_', ' ')})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="pt-4 flex space-x-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setAssigningQr(null)}
                    className="px-4 py-2 text-xs border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold transition-colors bg-white text-zinc-650 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignLoading || !selectedBusinessId}
                    className="px-4 py-2 text-xs bg-[#1857D6] hover:bg-[#154fc4] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer border-none flex items-center justify-center"
                  >
                    {assignLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : null}
                    Assign Sticker
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
