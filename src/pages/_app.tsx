import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import '@/styles/globals.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  // Always light mode — remove any previously saved dark theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  const augmentedPageProps = {
    ...pageProps,
    theme: 'light' as const,
    toggleTheme: () => {}, // No-op: dark mode disabled
  };

  return (
    <AuthProvider>
      <AuthGuard>
        <Component {...augmentedPageProps} />
      </AuthGuard>
    </AuthProvider>
  );
}
