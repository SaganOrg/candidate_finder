import { logout } from '@/lib/actions/auth';
import { getCurrentUserRole } from '@/lib/actions/users';
import Sidebar from '@/components/Sidebar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const userRole = await getCurrentUserRole();
  
  if (!userRole) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar logoutAction={logout} userRole={userRole} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}