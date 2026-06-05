// ─── Register Page ────────────────────────────────────────────────────────────
// Single step: fill form → account created → immediately logged in
// No OTP, no email verification — simple!

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, Loader2, Mail, Lock, User } from 'lucide-react';
import { authAPI } from '../services/api';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store/authSlice';
import toast from 'react-hot-toast';

export default function Register() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Validate form fields before submitting
  const validate = () => {
    const newErrors = {};
    if (!name || name.length < 2)          newErrors.name     = 'Name must be at least 2 characters';
    if (!email || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password || password.length < 8)  newErrors.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(password))      newErrors.password = 'Password needs at least one uppercase letter';
    else if (!/[0-9]/.test(password))      newErrors.password = 'Password needs at least one number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Register — backend returns token + user immediately
      const res = await authAPI.register({ name, email, password });

      // Log user in right away (no OTP step!)
      dispatch(setAuth({
        user:  res.data.user,
        token: res.data.token,  // single token
      }));

      toast.success('Welcome to DocuRec AI!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Registration failed. Please try again.');
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
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-sky-muted border border-sky/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-sky" />
          </div>
          <span className="text-xl font-semibold">DocuRec<span className="text-sky"> AI</span></span>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-semibold text-text-primary mb-1">Create account</h1>
          <p className="text-text-tertiary text-sm mb-6">Start processing Indian documents with AI</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-9"
                  placeholder="Rajesh Kumar"
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
            </div>

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
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
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
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                : 'Create account'
              }
            </button>
          </form>

          <p className="text-center text-text-tertiary text-sm mt-5">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-sky hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
