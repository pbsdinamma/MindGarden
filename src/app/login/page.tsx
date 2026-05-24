'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/components/ThemeProvider';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Handle URL errors or warnings
  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      toast.error(errorMsg);
    }
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
          router.push('/dashboard');
          router.refresh();
        }
      } else {
        // Sign Up
        if (!fullName) {
          toast.error('Please enter your full name');
          setLoading(false);
          return;
        }

        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          toast.error(error.message);
        } else {
          if (data?.session) {
            toast.success('Registration successful! Welcome to MindGarden.');
            router.push('/dashboard');
            router.refresh();
          } else {
            toast.success('Sign up complete! Please check your email for confirmation.', {
              duration: 5000,
            });
            setIsLogin(true);
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Dynamic Glowing Gradients in Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/5 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-500/5 pointer-events-none" />

      {/* Floating Theme Button */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-3 rounded-full border border-card-border bg-card-bg shadow-sm text-text-base smooth-hover hover:scale-105"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      {/* Main Authentic Card Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-effect p-8 rounded-3xl shadow-xl z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex p-3 bg-indigo-600/10 dark:bg-indigo-400/10 rounded-2xl mb-4"
          >
            <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            MindGarden
          </h1>
          <p className="text-sm text-muted mt-2">
            {isLogin ? 'Capture your thoughts, beautifully.' : 'Join us to design your digital sanctuary.'}
          </p>
        </div>

        {/* Form Toggle Slider Tab */}
        <div className="flex bg-muted-light p-1.5 rounded-2xl mb-6 relative">
          <div className="grid grid-cols-2 w-full text-center relative z-10">
            <button
              onClick={() => setIsLogin(true)}
              className={`py-2 text-sm font-semibold rounded-xl smooth-hover ${
                isLogin ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`py-2 text-sm font-semibold rounded-xl smooth-hover ${
                !isLogin ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted'
              }`}
            >
              Register
            </button>
          </div>
          <motion.div
            className="absolute top-1.5 left-1.5 bottom-1.5 w-[calc(50%-6px)] bg-card-bg shadow-sm rounded-xl"
            animate={{ x: isLogin ? 0 : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        </div>

        {/* Forms with Slide Animation */}
        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                <label className="text-xs font-semibold text-muted pl-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-3 bg-muted-light border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-text-base"
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-muted-light border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-text-base"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center pl-1">
              <label className="text-xs font-semibold text-muted">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => toast.success('Password reset is configured via Supabase dashboard!')}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-muted-light border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted smooth-hover hover:text-text-base"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer Disclaimer */}
        <p className="text-center text-xs text-muted mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy. All notes are securely encrypted and synchronized.
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
