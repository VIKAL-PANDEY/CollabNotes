import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, LogOut, User, LayoutDashboard, Menu, X } from 'lucide-react';
import { authService } from '../services/api';
import { useToast } from './Toast';

export const Navbar = ({ currentUser, setCurrentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
                <FileText className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-white via-slate-200 to-brand-500 bg-clip-text text-transparent">
                CollabNotes
              </span>
            </Link>
          </div>

          {/* Navigation for Logged In Users */}
          {currentUser ? (
            <>
              <div className="hidden md:flex items-center gap-6">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-slate-800 text-brand-500'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/profile')
                      ? 'bg-slate-800 text-brand-500'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Profile ({currentUser.username})
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors border border-rose-500/20 hover:border-rose-500/30"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>

              {/* Mobile menu trigger */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-500 hover:bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors shadow-md shadow-brand-500/10 hover:shadow-brand-500/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {currentUser && mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-2 pt-2 pb-3 space-y-1 animate-slide-in">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
              isActive('/dashboard') ? 'bg-slate-800 text-brand-500' : 'text-slate-300 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
              isActive('/profile') ? 'bg-slate-800 text-brand-500' : 'text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            Profile ({currentUser.username})
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};
