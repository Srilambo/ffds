import React from 'react';

function PlaceholderPage({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 fade-up">
      <div className="text-7xl mb-2">{icon}</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-slate-400 text-sm max-w-sm">{description}</p>
      <span className="text-xs text-blue-400 border border-blue-500/30 bg-blue-500/10 px-3 py-1 rounded-full">Business Feature</span>
    </div>
  );
}

export function ManagerInventory() {
  return <PlaceholderPage icon="🍎" title="Inventory Management" description="Add, edit, delete food items. Filter by category, color-coded freshness status, and bulk CSV import." />;
}

export function ManagerStaff() {
  return <PlaceholderPage icon="👥" title="Staff Management" description="Create staff accounts, view scan history, and manage team access controls." />;
}

export function ManagerScans() {
  return <PlaceholderPage icon="🔍" title="All Scans" description="View all scans done by you and your staff. Filter by date, food type, or freshness result." />;
}

export function ManagerWaste() {
  return <PlaceholderPage icon="📉" title="Waste Analytics" description="Weekly/monthly waste cost charts, most wasted food types, and exportable PDF compliance reports." />;
}

export function ManagerChatbot() {
  return <PlaceholderPage icon="🤖" title="Business AI Advisor" description="AI advisor pre-loaded with your inventory context. Get cost reduction and supplier quality insights." />;
}

export function ManagerBranches() {
  return <PlaceholderPage icon="🏢" title="Branch Management" description="Add/remove branches, view each branch individually, and compare waste vs scan metrics." />;
}
