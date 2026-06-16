import React from 'react';

function PlaceholderPage({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 fade-up">
      <div className="text-7xl mb-2">{icon}</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-slate-400 text-sm max-w-sm">{description}</p>
      <span className="text-xs text-purple-400 border border-purple-500/30 bg-purple-500/10 px-3 py-1 rounded-full">Admin Feature</span>
    </div>
  );
}

export function AdminUsers() {
  return <PlaceholderPage icon="👥" title="User Management" description="Search, filter, sort all users. Change roles, suspend, or delete accounts. View individual scan histories." />;
}

export function AdminModels() {
  return <PlaceholderPage icon="🧠" title="CNN Model Management" description="Upload new model versions, view current accuracy scores, and run A/B tests between models." />;
}

export function AdminLanguages() {
  return <PlaceholderPage icon="🌐" title="Language Management" description="Add new languages, edit translation strings, and preview UI in each supported language." />;
}

export function AdminReports() {
  return <PlaceholderPage icon="📄" title="Global Reports" description="Export PDF/Excel reports, view global food waste statistics, and country-by-country breakdowns." />;
}

export function AdminAnnouncements() {
  return <PlaceholderPage icon="📢" title="Announcements" description="Send push notifications to all users or specific role groups. Schedule future announcements." />;
}
