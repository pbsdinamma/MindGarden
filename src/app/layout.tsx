import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MindGarden — Elegant, Fast, Secure Full-Stack Note App',
  description: 'A beautiful, clean, responsive notes application with tags, colors, real-time sync and robust authentication. Powered by Next.js, Supabase, TypeScript and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-bg-base text-text-base antialiased transition-colors duration-200`}
      >
        <ThemeProvider defaultTheme="system">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-zinc-900 dark:text-zinc-100 border dark:border-zinc-800 bg-white text-zinc-900 border-zinc-200 font-medium rounded-xl shadow-lg',
              duration: 3000,
              style: {
                padding: '12px 16px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
