import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { User, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function RepsLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (router.query.error === 'access_denied') {
      const timer = setTimeout(() => {
        setError('Access denied. You do not have permissions to view that page.');
      }, 0);
      return () => clearTimeout(timer);
    } else if (router.query.error === 'session_expired') {
      const timer = setTimeout(() => {
        setError('Your session has expired. Please log in again.');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const res = await login(username, password, 'rep');
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative font-sans transition-colors duration-200">
      <Head>
        <title>Field Representative Portal Sign In - Cloutation</title>
      </Head>



      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 flex flex-col items-center">
        <div className="w-full flex justify-start">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-905 mb-6 transition-colors">
            <ArrowLeft size={12} className="mr-1" />
            Back to homepage
          </Link>
        </div>
        <div className="flex flex-col items-center mb-6">
          <img 
            src="/logo.png" 
            alt="Cloutation" 
            className="h-14 w-14 rounded-xl object-contain mix-blend-multiply transition-all duration-300 hover:scale-105" 
          />
          <span className="mt-2 font-sans text-xl font-bold tracking-tight text-slate-900">
            Cloutation
          </span>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Field Operations
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-500">
          Sign in to activate QR codes and onboard businesses
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white/80 backdrop-blur-md py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-200/50 transition-colors">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
              <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Username
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
                  <User size={16} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#073afe]/20 focus:border-[#073afe] transition-all"
                  placeholder="dan"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#073afe]/20 focus:border-[#073afe] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#073afe] hover:bg-[#052ecb] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#073afe] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                Authenticate Representative
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
