import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import { useToast } from '../components/Toast';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword } = formData;

    if (!username || !email || !password || !confirmPassword) {
      showToast('All fields are required', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(username, email, password);
      showToast('Registration successful! Please login.', 'success');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      const errMsg = error.response?.data?.detail || 'Registration failed. Try again.';
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[400px] w-[400px] rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 p-8 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Sign Up</h2>
          <p className="mt-2 text-sm text-slate-400">
            Create an account to start collaborating.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-slate-200 placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm transition-all"
                  placeholder="johndoe"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-slate-200 placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm transition-all"
                  placeholder="johndoe@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-slate-200 placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm transition-all"
                  placeholder="•••••••• (Min 6 chars)"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-slate-200 placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 py-3 px-4 text-sm font-semibold text-white transition-all shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-500 hover:text-brand-400 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
