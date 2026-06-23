import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string | null;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersManagement() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'SUPER_ADMIN') {
      fetchUsers();
    }
  }, [currentUser]);

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own Super Admin account.');
      return;
    }

    if (!window.confirm(`Are you absolutely sure you want to delete the user account for "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/super-admin/users?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user account');
      }
    } catch (err) {
      alert('Network error deleting user account');
    }
  };

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <ShieldCheck className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-1">Super Admin role required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="User Accounts">
      <Head>
        <title>Manage Users - Clout Reputation</title>
      </Head>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-xs rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder-slate-400"
            placeholder="Search accounts..."
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white shadow-sm border border-slate-200/60 rounded-2xl overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-violet-600 mb-2" />
              <p className="text-xs text-slate-500">Loading user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No users found</h3>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your query parameters.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    User Info
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Role Badge
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="relative px-6 py-3.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((u) => {
                  // Role Badge Styling
                  let roleStyles = 'bg-slate-50 text-slate-600 border border-slate-200/50';
                  let RoleIcon = KeyRound;

                  if (u.role === 'SUPER_ADMIN') {
                    roleStyles = 'bg-violet-50 text-violet-700 border border-violet-200/50 font-bold';
                    RoleIcon = ShieldAlert;
                  }

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                            {u.name[0].toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold">{u.name}</p>
                              {u.id === currentUser?.id ? (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                  You
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider gap-1 ${roleStyles}`}>
                          <RoleIcon size={10} />
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          disabled={u.id === currentUser?.id}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 transition-colors"
                          title={u.id === currentUser?.id ? "You cannot delete yourself" : "Delete user"}
                        >
                          <Trash2 size={16} />
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
    </DashboardLayout>
  );
}
