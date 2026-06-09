import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Activity, Clock, Shield } from 'lucide-react';
import { documentService } from '../services/api';
import { useToast } from '../components/Toast';

export const ProfilePage = ({ currentUser }) => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const activity = await documentService.getActivityLogs();
        // Filter logs belonging to the current user
        const userLogs = activity.filter(log => log.user_id === currentUser.id);
        setLogs(userLogs);
      } catch (error) {
        console.error(error);
        showToast('Failed to load profile activities', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [currentUser]);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm shadow-xl flex flex-col sm:flex-row items-center gap-6 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 h-32 w-32 rounded-full bg-brand-500/10 blur-3xl" />
        
        <div className="h-20 w-20 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500">
          <User className="w-10 h-10" />
        </div>
        
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white capitalize">{currentUser.username}</h1>
          <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-4 h-4 text-slate-500" />
            {currentUser.email}
          </p>
          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
            <Calendar className="w-3.5 h-3.5" />
            Joined on {new Date(currentUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Details Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4 shadow-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-4.5 h-4.5 text-brand-500" />
            Account Details
          </h2>
          
          <div className="space-y-3.5 text-sm">
            <div>
              <span className="text-slate-500 block text-xs">User ID</span>
              <span className="font-mono text-slate-300 font-semibold">{currentUser.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Email Status</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">Verified</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Security Role</span>
              <span className="text-slate-300 font-semibold">Standard Collaborator</span>
            </div>
          </div>
        </div>

        {/* User Activity feed */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4 shadow-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity className="w-4.5 h-4.5 text-brand-500" />
            My Action Logs
          </h2>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-10 bg-slate-800 rounded-lg w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No action logs found.</p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:border-slate-800 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-slate-200 capitalize">{log.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 whitespace-nowrap mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
