import React from 'react';
import { useTranslation } from 'react-i18next';

function PlaceholderPage({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 fade-up">
      <div className="text-7xl mb-2">{icon}</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-slate-400 text-sm max-w-sm">{description}</p>
      <span className="text-xs text-brand-400 border border-brand-500/30 bg-brand-500/10 px-3 py-1 rounded-full">Coming Soon</span>
    </div>
  );
}

export function BatchScan() {
  return <PlaceholderPage icon="📦" title="Batch Scan" description="Upload 20-50 harvest images at once. Get quality scores and PDF reports for buyers." />;
}

export function FarmerCalendar() {
  return <PlaceholderPage icon="📅" title="Harvest Calendar" description="View past batches, get best sell time recommendations, and seasonal freshness trends." />;
}

export function LossTracking() {
  return <PlaceholderPage icon="📉" title="Loss Tracker" description="Record harvest vs sold vs wasted quantities. Track financial losses with monthly charts." />;
}

export function BuyerReports() {
  return <PlaceholderPage icon="📜" title="Buyer Reports" description="Generate shareable batch quality certificates with QR codes for buyer verification." />;
}

export function FarmerChatbot() {
  return <PlaceholderPage icon="🤖" title="Farmer AI Advisor" description="Get post-harvest guidance on storage temperatures, transport logistics, and sell decisions." />;
}
