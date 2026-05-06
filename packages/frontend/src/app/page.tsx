import { Header } from '@/components/layout/header';

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Projects" value="0" />
          <StatCard label="Active Agents" value="0" />
          <StatCard label="Running Tasks" value="0" />
          <StatCard label="Events Today" value="0" />
        </div>
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h3>
          <div className="rounded-lg border border-gray-800 p-8 text-center text-gray-600">
            No activity yet. Create a project to get started.
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
