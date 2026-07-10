import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import '@/styles/globals.css';
import { useEffect } from 'react';
import { Inter, Source_Sans_3 } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '900'],
  variable: '--font-source-sans',
  display: 'swap',
});

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
        <div className={`${inter.variable} ${sourceSans.variable} font-sans`}>
          <Component {...augmentedPageProps} />
        </div>
      </AuthGuard>
    </AuthProvider>
  );
}
