import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Zap, Shield, ChevronRight, Activity, Download } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-28 lg:px-8 flex flex-col items-center text-center">
        {/* Banner badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/5 px-3 py-1 text-sm text-brand-500 hover:bg-brand-500/10 transition-colors cursor-pointer mb-8 animate-fade-in">
          <Zap className="w-4 h-4 fill-brand-500/20" />
          <span>Real-time engine active</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl leading-none">
          Collaborate on notes <br />
          <span className="bg-gradient-to-r from-brand-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent">
            instantly and seamlessly.
          </span>
        </h1>
        
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Work together in real-time. Share documents, track cursor placements, monitor presence, view revision logs, and export to PDF. Beautiful, secure, and fast.
        </p>

        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/register"
            className="rounded-xl bg-brand-500 hover:bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm px-6 py-3.5 text-base font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition-all hover:bg-slate-900"
          >
            Sign In
          </Link>
        </div>

        {/* Hero mockup/preview */}
        <div className="mt-16 sm:mt-20 w-full max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-2xl backdrop-blur-md relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent -bottom-px rounded-2xl z-10 pointer-events-none" />
          <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 mb-4">
            <div className="h-3 w-3 rounded-full bg-rose-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs text-slate-500 ml-4 font-mono">collabnotes.project/document/12</span>
          </div>
          <div className="h-64 sm:h-96 rounded-lg bg-slate-950/80 p-6 text-left border border-slate-900 font-mono text-sm text-slate-400 space-y-4 overflow-hidden relative">
            <p className="text-brand-400 font-semibold">// CollabNotes live terminal connection</p>
            <p className="text-slate-300"># Welcome to the note collaboration space!</p>
            <p className="text-slate-500">&gt; User "Alice" joined room.</p>
            <p className="text-slate-500">&gt; User "Bob" joined room.</p>
            <p className="text-slate-300 mt-2">
              Our real-time editor allows simultaneous editing across documents. Cursors are color-coded, updates are synced instantaneously, and changes are committed safely.
            </p>
            <div className="inline-block px-1 border-r-2 border-brand-500 animate-pulse text-brand-500">Bob is typing...</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-slate-900 bg-slate-950/50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-brand-500">Fast & Secure</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Packed with powerful features
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm hover:border-brand-500/30 transition-all hover:bg-slate-900/50">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    <Users className="h-6 w-6" />
                  </div>
                  Real-time Collaboration
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                  <p className="flex-auto">Multiple users edit the same file. Cursors, selection bounds, active presence lists, and typing alerts match users on the page.</p>
                </dd>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm hover:border-brand-500/30 transition-all hover:bg-slate-900/50">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    <Activity className="h-6 w-6" />
                  </div>
                  Version History & Logs
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                  <p className="flex-auto">Every edit creates a milestone version history. Recover past states easily and view who updated the document at what time.</p>
                </dd>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm hover:border-brand-500/30 transition-all hover:bg-slate-900/50">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    <Download className="h-6 w-6" />
                  </div>
                  Secure Sharing & Export
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                  <p className="flex-auto">Manage permissions (Viewer or Editor) easily using usernames, or download documents instantly into formatted PDF exports.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
