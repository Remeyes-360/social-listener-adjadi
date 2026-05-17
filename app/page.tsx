import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('./DashboardContent'), { ssr: false });

export default function Page() {
  return <Dashboard />;
}
