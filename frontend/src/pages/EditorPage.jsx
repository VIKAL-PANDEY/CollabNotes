import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Download, Share2, History, Save, 
  UserPlus, Shield, Trash2, Check, AlertCircle, FileText, Clock, RotateCcw
} from 'lucide-react';
import { documentService } from '../services/api';
import { DocumentSocket } from '../services/websocket';
import { useToast } from '../components/Toast';

export const EditorPage = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [document, setDocument] = useState(null);
  const [permission, setPermission] = useState('Viewer');
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [remoteCursors, setRemoteCursors] = useState({});
  
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saved', 'Saving...', 'Error'
  
  // Modals / Panels
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [sharedUsersList, setSharedUsersList] = useState([]);
  const [shareUsername, setShareUsername] = useState('');
  const [sharePermission, setSharePermission] = useState('Viewer');
  const [isSharing, setIsSharing] = useState(false);
  
  const [historyList, setHistoryList] = useState([]);
  const [selectedHistoryVer, setSelectedHistoryVer] = useState(null);
  
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch initial document data
  const fetchDoc = async () => {
    try {
      const doc = await documentService.get(id);
      setDocument(doc);
      setTitleInput(doc.title);
      setContentInput(doc.content);
      
      // Determine permission level for current user
      if (doc.owner_id === currentUser.id) {
        setPermission('Owner');
      } else {
        // Find user share permission
        const shareRecord = doc.shares?.find(s => s.user_id === currentUser.id);
        setPermission(shareRecord ? shareRecord.permission : 'Viewer');
      }
      
      setSaveStatus('Saved');
    } catch (error) {
      console.error('Error fetching document:', error);
      showToast('Could not access document or permission denied', 'error');
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    if (id) {
      fetchDoc();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  // 2. Establish WebSocket connection
  useEffect(() => {
    if (!document) return;

    socketRef.current = new DocumentSocket(id, {
      onConnect: () => {
        console.log('WS connection established inside EditorPage');
      },
      onDisconnect: () => {
        console.log('WS connection closed inside EditorPage');
      },
      onMessage: (message) => {
        const { event, user_id, username, color, content, title, is_typing, cursor, active_users } = message;
        
        switch (event) {
          case 'user_joined':
            setActiveUsers(active_users || []);
            break;
            
          case 'user_left':
            setActiveUsers(active_users || []);
            // Clean up typing and cursor metadata
            setTypingUsers(prev => {
              const next = { ...prev };
              delete next[user_id];
              return next;
            });
            setRemoteCursors(prev => {
              const next = { ...prev };
              delete next[user_id];
              return next;
            });
            break;
            
          case 'document_update':
            // Only update local view if the edit came from someone else
            if (user_id !== currentUser.id) {
              setSaveStatus('Saving...');
              if (title !== undefined) setTitleInput(title);
              if (content !== undefined) setContentInput(content);
              
              setSaveStatus('Saved');
            }
            break;
            
          case 'user_typing':
            setTypingUsers(prev => ({
              ...prev,
              [user_id]: { username, is_typing }
            }));
            break;
            
          case 'cursor_move':
            if (user_id !== currentUser.id) {
              setRemoteCursors(prev => ({
                ...prev,
                [user_id]: { username, color, cursor }
              }));
            }
            break;
            
          case 'error':
            showToast(message.message || 'An error occurred over WebSocket', 'error');
            break;
            
          default:
            break;
        }
      },
      onError: (err) => {
        console.error('WS Error:', err);
        setSaveStatus('Error');
      }
    });

    socketRef.current.connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [document]);

  // 3. User input edits (Title and Text content)
  const handleTitleChange = (e) => {
    if (permission === 'Viewer') return;
    const newTitle = e.target.value;
    setTitleInput(newTitle);
    setSaveStatus('Saving...');
    
    // Broadcast changes
    if (socketRef.current) {
      socketRef.current.sendUpdate(newTitle, contentInput);
    }
    setSaveStatus('Saved');
  };

  const handleContentChange = (e) => {
    if (permission === 'Viewer') return;
    const newContent = e.target.value;
    setContentInput(newContent);
    setSaveStatus('Saving...');

    // Broadcast edits
    if (socketRef.current) {
      socketRef.current.sendUpdate(titleInput, newContent);
    }
    setSaveStatus('Saved');

    // Trigger typing state
    handleTypingIndicator();
    
    // Track cursor change
    handleCursorMove(e.target);
  };

  const handleTypingIndicator = () => {
    if (!socketRef.current) return;
    
    // Send typing: true if not already typing
    socketRef.current.sendTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.sendTyping(false);
      }
    }, 1500);
  };

  const handleCursorMove = (target) => {
    if (!socketRef.current) return;
    
    const cursorPosition = {
      index: target.selectionStart,
      length: target.selectionEnd - target.selectionStart
    };
    
    socketRef.current.sendCursor(cursorPosition);
  };

  const handleSelection = (e) => {
    handleCursorMove(e.target);
  };

  // 4. Exporter
  const handleExportPDF = () => {
    try {
      const url = documentService.getExportUrl(id);
      window.open(url, '_blank');
      showToast('Document exported to PDF!', 'success');
    } catch (error) {
      showToast('Failed to export document', 'error');
    }
  };

  // 5. Sharing helpers
  const openShareModal = async () => {
    setShowShareModal(true);
    try {
      const users = await documentService.getSharedUsers(id);
      setSharedUsersList(users);
    } catch (error) {
      showToast('Failed to load shared users list', 'error');
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareUsername.trim()) {
      showToast('Username cannot be empty', 'warning');
      return;
    }

    setIsSharing(true);
    try {
      await documentService.share(id, shareUsername.trim(), sharePermission);
      showToast(`Document shared with ${shareUsername} successfully!`, 'success');
      setShareUsername('');
      
      // Refresh list
      const users = await documentService.getSharedUsers(id);
      setSharedUsersList(users);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.detail || 'Failed to share document';
      showToast(errMsg, 'error');
    } finally {
      setIsSharing(false);
    }
  };

  // 6. History version helpers
  const openHistoryPanel = async () => {
    setShowHistoryPanel(true);
    try {
      const history = await documentService.getHistory(id);
      setHistoryList(history);
    } catch (error) {
      showToast('Failed to load history versions', 'error');
    }
  };

  const handleRestoreVersion = async (content) => {
    if (permission === 'Viewer') return;
    if (!window.confirm('Are you sure you want to restore this version? This will overwrite current changes.')) {
      return;
    }

    setSaveStatus('Saving...');
    setContentInput(content);
    
    try {
      // Send changes over HTTP to properly tag history version restoration
      await documentService.update(id, titleInput, content);
      
      // Also broadcast over socket
      if (socketRef.current) {
        socketRef.current.sendUpdate(titleInput, content);
      }
      
      setSelectedHistoryVer(null);
      setShowHistoryPanel(false);
      showToast('Document version restored!', 'success');
      setSaveStatus('Saved');
    } catch (error) {
      showToast('Failed to restore version', 'error');
      setSaveStatus('Error');
    }
  };

  if (!document) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 space-y-6 animate-pulse">
        <div className="h-10 w-1/3 bg-slate-800 rounded-lg" />
        <div className="h-64 w-full bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  // Generate current typing names string
  const typingUsersList = Object.values(typingUsers)
    .filter(u => u.is_typing)
    .map(u => u.username);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-950">
      {/* Editor Sub-Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-grow">
              <input
                type="text"
                value={titleInput}
                onChange={handleTitleChange}
                disabled={permission === 'Viewer'}
                className="bg-transparent border-0 font-bold text-lg text-white focus:ring-0 focus:outline-none placeholder:text-slate-600 w-full focus:border-b focus:border-brand-500 pb-0.5"
                placeholder="Untitled Document"
              />
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-medium">Role: {permission}</span>
                <span className="text-slate-700">•</span>
                <span className="text-xs flex items-center gap-1">
                  {saveStatus === 'Saving...' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />}
                  {saveStatus === 'Saved' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  {saveStatus === 'Error' && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
                  <span className="text-slate-400 font-mono">{saveStatus}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Active presence icons */}
            <div className="flex -space-x-2 mr-2" title="Active users in document">
              {activeUsers.map((user) => (
                <span
                  key={user.user_id}
                  className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-950 capitalize border"
                  style={{ borderColor: user.color }}
                  title={`${user.username} ${user.user_id === currentUser.id ? '(You)' : ''}`}
                >
                  {user.username[0]}
                </span>
              ))}
              {activeUsers.length === 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-850">
                  <Users className="w-3.5 h-3.5" />
                  Offline
                </div>
              )}
            </div>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-850 text-slate-300 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Export
            </button>

            <button
              onClick={openHistoryPanel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-850 text-slate-300 hover:text-white transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>

            {permission === 'Owner' && (
              <button
                onClick={openShareModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/10 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-3 relative">
        {/* Workspace Card */}
        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm flex flex-col shadow-inner relative">
          
          {/* Cursors indicator inside editor (summary header) */}
          {Object.keys(remoteCursors).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 bg-slate-950/40 p-2 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold pt-1 pl-1">Cursors:</span>
              {Object.entries(remoteCursors).map(([uid, data]) => (
                <span 
                  key={uid} 
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md text-white font-medium"
                  style={{ backgroundColor: `${data.color}20`, border: `1px solid ${data.color}50` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: data.color }} />
                  {data.username} (char {data.cursor?.index ?? 0})
                </span>
              ))}
            </div>
          )}

          <textarea
            ref={editorRef}
            value={contentInput}
            onChange={handleContentChange}
            onKeyUp={handleSelection}
            onMouseUp={handleSelection}
            onScroll={handleSelection}
            disabled={permission === 'Viewer'}
            className="flex-1 w-full bg-transparent border-0 text-slate-200 placeholder:text-slate-700 resize-none focus:ring-0 focus:outline-none font-sans text-base leading-relaxed"
            placeholder={permission === 'Viewer' ? "This document is read-only." : "Type your note here..."}
          />
        </div>

        {/* Footer info: Typing indicator */}
        <div className="h-6 flex items-center justify-between text-xs text-slate-500 font-medium px-2">
          <div>
            {typingUsersList.length > 0 && (
              <span className="text-brand-400 animate-pulse font-semibold">
                {typingUsersList.join(', ')} {typingUsersList.length === 1 ? 'is' : 'are'} typing...
              </span>
            )}
          </div>
          <div>
            Character count: {contentInput.length}
          </div>
        </div>
      </div>

      {/* Share Document Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-500" />
                Share Document
              </h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Sharing form */}
            <form onSubmit={handleShareSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Username of collaborator..."
                  required
                  value={shareUsername}
                  onChange={(e) => setShareUsername(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-slate-200 placeholder:text-slate-650 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none text-sm"
                />
              </div>
              <div className="sm:w-32">
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none text-sm cursor-pointer"
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Editor">Editor</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSharing}
                className="rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/10 transition-colors disabled:opacity-50"
              >
                {isSharing ? 'Sharing...' : 'Share'}
              </button>
            </form>

            {/* Current Shared Users List */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">People with access</h4>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {sharedUsersList.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center font-bold text-xs text-brand-400 capitalize">
                        {user.username[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{user.username}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      {user.permission}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Panel Drawer */}
      {showHistoryPanel && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slide-in">
          <div className="p-5 border-b border-slate-850 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-brand-500" />
              Version History
            </h3>
            <button 
              onClick={() => {
                setShowHistoryPanel(false);
                setSelectedHistoryVer(null);
              }}
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {historyList.map((ver) => (
              <div 
                key={ver.id}
                onClick={() => setSelectedHistoryVer(ver)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:bg-slate-850 ${
                  selectedHistoryVer?.id === ver.id 
                    ? 'border-brand-500 bg-brand-500/5 shadow-md shadow-brand-500/5' 
                    : 'border-slate-800 bg-slate-950/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                    Version {ver.version}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(ver.created_at).toLocaleString()}
                  </div>
                </div>
                <p className="text-xs text-slate-400 truncate mb-1">
                  Edited by: <span className="font-semibold text-slate-300">{ver.updated_by.username}</span>
                </p>
                <p className="text-[11px] text-slate-600 font-mono line-clamp-2 bg-slate-950/40 p-1.5 rounded border border-slate-900 mt-2">
                  {ver.content || '(Empty contents)'}
                </p>
              </div>
            ))}
          </div>

          {/* Version preview / Restore buttons */}
          {selectedHistoryVer && (
            <div className="border-t border-slate-850 p-5 bg-slate-950/80 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Previewing Version {selectedHistoryVer.version}</span>
                {permission !== 'Viewer' && (
                  <button
                    onClick={() => handleRestoreVersion(selectedHistoryVer.content)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore this version
                  </button>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 whitespace-pre-wrap">
                {selectedHistoryVer.content || '(Empty content)'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
