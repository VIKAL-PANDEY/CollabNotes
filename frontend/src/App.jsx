import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/api';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { ProfilePage } from './pages/ProfilePage';
import { Loader2 } from 'lucide-react';

const AppContent = ({ currentUser, setCurrentUser, isAuthChecking }) => {
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
          <span className="text-sm font-semibold text-slate-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  // Helper component for routing guards
  const PrivateRoute = ({ children }) => {
    return currentUser ? children : <Navigate to="/login" replace />;
  };

  const AuthRoute = ({ children }) => {
    return !currentUser ? children : <Navigate to="/dashboard" replace />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased">
      <Navbar currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route 
            path="/login" 
            element={
              <AuthRoute>
                <LoginPage setCurrentUser={setCurrentUser} />
              </AuthRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <AuthRoute>
                <RegisterPage />
              </AuthRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/editor/:id" 
            element={
              <PrivateRoute>
                <EditorPage currentUser={currentUser} />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <ProfilePage currentUser={currentUser} />
              </PrivateRoute>
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.me();
          setCurrentUser(user);
        } catch (error) {
          console.error('Session validation failed:', error);
          authService.logout();
        }
      }
      setIsAuthChecking(false);
    };

    checkSession();
  }, []);

  return (
    <ToastProvider>
      <Router>
        <AppContent 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
          isAuthChecking={isAuthChecking} 
        />
      </Router>
    </ToastProvider>
  );
}
