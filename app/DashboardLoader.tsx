'use client';

import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('./DashboardContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement du dashboard...</div>
    </div>
  ),
});

export default function DashboardLoader() {
  return <Dashboard />;
}
