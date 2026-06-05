// ─── Login Page ───────────────────────────────────────────────────────────────
// Simple login form — no react-hook-form, just useState

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, Loader2, Mail, Lock } from 'lucide-react';
import { authAPI } from '../services/api';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store/authSlice';
import toast from 'react-hot-toast';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Simple client-side validation before submitting
  const validate = () => {
    const newErrors = {};
    if (!email)                          newErrors.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email  = 'Enter a valid email';
    if (!password)                       newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });

      // Save user + token to Redux (and localStorage automatically via slice)
      dispatch(setAuth({
        user:  res.data.user,
        token: res.data.token,  // single token — simple!
      }));

      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      {/* Dot grid background */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#38BDF8 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-sky-muted border border-sky/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-sky" />
          </div>
          <span className="text-xl font-semibold">
            DocuRec<span className="text-sky"> AI</span>
          </span>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-semibold text-text-primary mb-1">Sign in</h1>
          <p className="text-text-tertiary text-sm mb-6">Access your document intelligence hub</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9 pr-9"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : 'Sign in'
              }
            </button>
          </form>

          <p className="text-center text-text-tertiary text-sm mt-5">
            No account?{' '}
            <Link to="/auth/register" className="text-sky hover:underline">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
