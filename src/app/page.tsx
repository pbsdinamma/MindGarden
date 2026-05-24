import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { 
  Sparkles, 
  ArrowRight, 
  Shield, 
  Zap, 
  Palette, 
  Smartphone, 
  CheckCircle,
  FolderLock
} from 'lucide-react';

export default async function LandingPage() {
  // Check user authentication status on the server
  let isLoggedIn = false;
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    isLoggedIn = false;
  }

  const features = [
    {
      icon: <Shield className="w-5 h-5 text-indigo-500" />,
      title: "Secure Authentication",
      desc: "Robust login, register, and middleware protection powered by Supabase Auth."
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: "Lightning Fast Syncing",
      desc: "Real-time updates and seamless edits so your thoughts are never lost."
    },
    {
      icon: <Palette className="w-5 h-5 text-emerald-500" />,
      title: "Custom Card Colors",
      desc: "Personalize your workspace with curated soft pastel notes color systems."
    },
    {
      icon: <Smartphone className="w-5 h-5 text-indigo-500" />,
      title: "Responsive Interface",
      desc: "Beautiful custom drawer sidebars designed to feel premium on mobile, tablet, or desktop."
    },
    {
      icon: <FolderLock className="w-5 h-5 text-purple-500" />,
      title: "Tags & Categorization",
      desc: "Easily group notes with tag builders, fast sidebar filtering, and deep search keyword indexes."
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-teal-500" />,
      title: "Auto-Theme Synchronization",
      desc: "Perfect Light and Dark themes syncing smoothly with system settings."
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[70%] rounded-full bg-indigo-500/10 blur-[150px] dark:bg-indigo-500/5 pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-10%] w-[80%] h-[70%] rounded-full bg-purple-500/10 blur-[150px] dark:bg-purple-500/5 pointer-events-none" />

      {/* Landing Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-400/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            MindGarden
          </span>
        </div>

        <div>
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="py-2.5 px-5 bg-card-bg border border-card-border/80 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold shadow-sm transition-all smooth-hover inline-flex items-center gap-1.5"
          >
            <span>{isLoggedIn ? "Go to Dashboard" : "Sign In"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Showcase Hero */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 md:py-24 z-10 flex-1 flex flex-col justify-center items-center">
        {/* Banner Tag */}
        <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-3 h-3" />
          <span>V1.0 is officially live</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-center tracking-tight leading-[1.1] max-w-3xl">
          Capture your thoughts in your{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            digital sanctuary
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400 text-center max-w-xl mt-6 leading-relaxed">
          An elegant, full-stack notes workspace with fluid micro-animations, customizable colors, smart tags, secure authentication, and real-time syncing.
        </p>

        {/* Actions CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center w-full max-w-md">
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="py-3.5 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all text-center flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <span>{isLoggedIn ? "Access Sanctuary" : "Get Started Now"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          {!isLoggedIn && (
            <Link
              href="/login?tab=register"
              className="py-3.5 px-8 bg-card-bg border border-card-border hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-sm font-semibold shadow-sm transition-all text-center flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Explore Sandbox</span>
            </Link>
          )}
        </div>

        {/* Features Grid Panel */}
        <section className="mt-24 md:mt-32 w-full">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-zinc-200">
              Designed to feel premium and fast
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">
              Every detail optimized for user engagement and gorgeous aesthetics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, index) => (
              <div
                key={index}
                className="bg-card-bg border border-card-border/80 hover:border-indigo-500/50 dark:hover:border-indigo-400/30 p-6 rounded-2xl shadow-sm smooth-hover flex flex-col gap-4 relative group"
              >
                <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl w-fit group-hover:scale-105 transition-transform duration-200">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-sm tracking-tight text-slate-800 dark:text-zinc-200">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Elegant Footer */}
      <footer className="w-full py-8 border-t border-card-border/60 text-center z-10">
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium tracking-wide">
          © {new Date().getFullYear()} MindGarden. Built with Next.js, Supabase, TypeScript, and Tailwind CSS.
        </p>
      </footer>
    </div>
  );
}
