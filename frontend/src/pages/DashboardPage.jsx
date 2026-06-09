import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, FileText, Trash2, Calendar, Shield, Clock, ExternalLink, Activity, Sparkles } from 'lucide-react';
import { documentService } from '../services/api';
import { useToast } from '../components/Toast';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [documents, setDocuments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const docs = await documentService.list(searchQuery);
      setDocuments(docs);
      const logs = await documentService.getActivityLogs();
      setActivityLogs(logs);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [searchQuery]);

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      showToast('Document title cannot be empty', 'warning');
      return;
    }

    setIsCreating(true);
    try {
      const newDoc = await documentService.create(newDocTitle.trim());
      showToast(`Document "${newDoc.title}" created!`, 'success');
      setShowCreateModal(false);
      setNewDocTitle('');
      navigate(`/editor/${newDoc.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
      showToast('Failed to create document', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async (id, title, e) => {
    e.preventDefault(); // Prevent navigating to the editor page on click
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete the document "${title}"?`)) {
      return;
    }

    try {
      await documentService.delete(id);
      showToast('Document deleted successfully', 'success');
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting document:', error);
      const errMsg = error.response?.data?.detail || 'Failed to delete document';
      showToast(errMsg, 'error');
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getPermissionBadge = (permission) => {
    switch (permission) {
      case 'Owner':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-400 border border-brand-500/20">
            <Shield className="w-3 h-3" />
            Owner
          </span>
        );
      case 'Editor':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            Editor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
            Viewer
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/60 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            My Documents
            <Sparkles className="w-5 h-5 text-brand-500" />
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Manage, collaborate, and edit your notes in real time.
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/15 hover:shadow-brand-500/30 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            New Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Document Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search bar */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search documents by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm py-3 pl-10 pr-4 text-slate-200 placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm transition-all"
            />
          </div>

          {/* Skeletons loader */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-40 rounded-2xl border border-slate-800/80 bg-slate-900/20 p-5 space-y-4 animate-pulse">
                  <div className="h-5 w-2/3 bg-slate-800 rounded-md" />
                  <div className="h-3 w-1/2 bg-slate-800 rounded-md" />
                  <div className="h-4 w-1/4 bg-slate-800 rounded-full" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white">No documents found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchQuery ? 'Try matching another search keyword.' : 'Create a new document to get started.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-sm font-medium text-slate-200 border border-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create one now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/editor/${doc.id}`}
                  className="group relative flex flex-col justify-between h-40 p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm hover:border-brand-500/40 hover:bg-slate-900/60 shadow-md transition-all hover:shadow-brand-500/5 hover:-translate-y-0.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg text-slate-100 group-hover:text-brand-400 transition-colors truncate">
                        {doc.title}
                      </h3>
                      {doc.user_permission === 'Owner' && (
                        <button
                          onClick={(e) => handleDeleteDocument(doc.id, doc.title, e)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <span>By {doc.owner.username}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/50 pt-3 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(doc.updated_at)}</span>
                    </div>
                    {getPermissionBadge(doc.user_permission)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Activity Logs Panel */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm p-5 space-y-4 shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-4.5 h-4.5 text-brand-500" />
              Activity Feed
            </h2>

            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-800" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-slate-800 rounded w-3/4" />
                      <div className="h-2.5 bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent activities found.</p>
            ) : (
              <div className="flow-root max-h-[400px] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                <ul className="-mb-8">
                  {activityLogs.map((log, logIdx) => (
                    <li key={log.id}>
                      <div className="relative pb-6">
                        {logIdx !== activityLogs.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-800" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-slate-950 flex items-center justify-center ring-4 ring-slate-900 text-xs font-bold text-brand-500 border border-slate-800">
                              {log.user.username[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5">
                            <p className="text-xs text-slate-300">
                              <span className="font-semibold text-white">{log.user.username}</span>{' '}
                              {log.details || log.action}
                            </p>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDate(log.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-850 bg-slate-900 p-6 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-2">Create New Document</h3>
            <p className="text-sm text-slate-400 mb-6">Give your document a clear name to share and collaborate on.</p>
            
            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label htmlFor="docTitle" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Document Title
                </label>
                <input
                  id="docTitle"
                  type="text"
                  required
                  placeholder="Meeting Notes, Product Spec..."
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 px-3 text-slate-200 placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewDocTitle('');
                  }}
                  className="rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/10 transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
