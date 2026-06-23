import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  UserMinus, 
  UserCheck, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  X,
  Calendar,
  Layers,
  ShieldCheck
} from 'lucide-react';

interface RepUser {
  id: string;
  name: string;
  username: string;
  isActive: boolean;
  createdAt: string;
  businessesCount: number;
  assignmentsCount: number;
  lastActivity: string | null;
}

export default function RepsManagementPage(props: any) {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  // Reps State
  const [reps, setReps] = useState<RepUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedRep, setSelectedRep] = useState<RepUser | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchReps = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/super-admin/reps');
      if (res.ok) {
        const data = await res.json();
        setReps(data.reps || []);
      } else {
        setError('Failed to fetch representatives.');
      }
    } catch (err) {
      setError('Network error fetching representatives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchReps();
    }
  }, [user]);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setSelectedRep(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      isActive: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (rep: RepUser) => {
    setModalMode('EDIT');
    setSelectedRep(rep);
    setFormData({
      name: rep.name,
      username: rep.username,
      password: '', // Leave blank to not change password
      isActive: rep.isActive
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    setError('');

    if (!formData.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!formData.username.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (modalMode === 'CREATE' && !formData.password.trim()) {
      setFormError('Password is required.');
      return;
    }

    try {
      setSubmitting(true);
      
      const url = '/api/super-admin/reps';
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT';
      const body: any = { ...formData };
      
      if (modalMode === 'EDIT' && selectedRep) {
        body.id = selectedRep.id;
        // Don't submit blank password
        if (!body.password.trim()) {
          delete body.password;
        }
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(modalMode === 'CREATE' ? 'Representative created successfully.' : 'Representative updated successfully.');
        setIsModalOpen(false);
        fetchReps();
      } else {
        setFormError(data.error || 'Operation failed.');
      }
    } catch (err) {
      setFormError('Network error processing request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (rep: RepUser) => {
    setSuccess('');
    setError('');
    
    const nextActive = !rep.isActive;
    const confirmMsg = nextActive 
      ? `Are you sure you want to reactivate representative "${rep.name}"?` 
      : `Are you sure you want to deactivate representative "${rep.name}"? Deactivated representatives will be immediately blocked from signing in.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/super-admin/reps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rep.id,
          isActive: nextActive
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Representative "${rep.name}" has been ${nextActive ? 'activated' : 'deactivated'}.`);
        fetchReps();
      } else {
        setError(data.error || 'Failed to update representative status.');
      }
    } catch (err) {
      setError('Network error updating representative status.');
    }
  };

  // Filter reps by search query
  const filteredReps = reps.filter(rep => {
    const query = searchQuery.toLowerCase();
    return (
      rep.name.toLowerCase().includes(query) ||
      rep.username.toLowerCase().includes(query)
    );
  });

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
    <DashboardLayout title="Field Representatives" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Representatives Management - Clout Reputation</title>
        
      </Head>

      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <p className="text-xs text-zinc-500 mt-0.5">Create and manage accounts for field onboarding representatives.</p>
        <button
          onClick={openCreateModal}
          className="bg-[#1857D6] hover:bg-[#154fc4] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Plus size={14} />
          Add Representative
        </button>
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

      {/* Main Content Card */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {/* Table Filter Header */}
        <div className="p-4 bg-slate-50/20 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-[#1857D6]" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-sans">Representative Accounts</h4>
          </div>

          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search size={12} className="text-zinc-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or username"
              className="pl-8 pr-3 py-1.5 w-full text-xs border border-zinc-250 rounded bg-white focus:border-[#1857D6] focus:outline-none"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {loading && reps.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-6 w-6 text-[#1857D6] mx-auto mb-2" />
              <span className="text-xs text-zinc-450">Loading representatives...</span>
            </div>
          ) : filteredReps.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              No representatives found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-zinc-150 text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-400 uppercase font-bold tracking-wider text-[10px] border-b border-zinc-150">
                <tr>
                  <th className="px-6 py-3">Representative</th>
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3 text-center">Businesses Onboarded</th>
                  <th className="px-6 py-3 text-center">QR Code Assignments</th>
                  <th className="px-6 py-3">Last Activity</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 bg-white">
                {filteredReps.map((rep) => (
                  <tr key={rep.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-black">{rep.name}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center mt-0.5">
                        <Calendar size={10} className="mr-1" />
                        Added {new Date(rep.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-zinc-650 font-medium">{rep.username}</td>
                    <td className="px-6 py-3.5 text-center font-bold text-black">{rep.businessesCount}</td>
                    <td className="px-6 py-3.5 text-center font-bold text-black">{rep.assignmentsCount}</td>
                    <td className="px-6 py-3.5 text-zinc-500">
                      {rep.lastActivity ? (
                        new Date(rep.lastActivity).toLocaleString()
                      ) : (
                        <span className="text-zinc-350 italic">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rep.isActive 
                          ? 'bg-emerald-50 text-emerald-750 border border-emerald-150'
                          : 'bg-red-50 text-red-750 border border-red-150'
                      }`}>
                        {rep.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(rep)}
                        className="inline-flex items-center space-x-1 p-1 bg-white border border-zinc-250 rounded hover:bg-zinc-50 text-zinc-700 font-semibold text-[10px]"
                        title="Edit credentials"
                      >
                        <Edit2 size={10} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleToggleActive(rep)}
                        className={`inline-flex items-center space-x-1 p-1 border rounded font-semibold text-[10px] ${
                          rep.isActive
                            ? 'bg-red-50 hover:bg-red-100/70 text-red-700 border-red-200'
                            : 'bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 border-emerald-200'
                        }`}
                        title={rep.isActive ? 'Deactivate REP account' : 'Reactivate REP account'}
                      >
                        {rep.isActive ? <UserMinus size={10} /> : <UserCheck size={10} />}
                        <span>{rep.isActive ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Rep Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded shadow-lg max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-150 bg-zinc-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-black flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#1857D6]" />
                {modalMode === 'CREATE' ? 'Add Representative' : 'Edit Representative'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-zinc-200 rounded text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4 text-xs">
                {formError && (
                  <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 font-medium text-[11px]">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Jane Doe"
                    className="w-full p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. janedoe"
                    className="w-full p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider">
                      {modalMode === 'CREATE' ? 'Password' : 'New Password (Optional)'}
                    </label>
                    {modalMode === 'EDIT' && (
                      <span className="text-[9px] text-zinc-400">Leave blank to keep current</span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={modalMode === 'CREATE' ? 'Enter secure password' : 'Enter new password'}
                    className="w-full p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                    required={modalMode === 'CREATE'}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-150 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-250 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1857D6] hover:bg-[#154fc4] text-white text-xs font-semibold rounded transition-colors flex items-center gap-1"
                >
                  {submitting && <Loader2 className="animate-spin h-3.5 w-3.5" />}
                  <span>{modalMode === 'CREATE' ? 'Add Rep' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
