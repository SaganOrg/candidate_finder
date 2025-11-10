import { getCurrentUserRole } from '@/lib/actions/users';
import { redirect } from 'next/navigation';
import AdminMigrationPage from './AdminMigrationPage';

export const dynamic = "force-dynamic";

export default async function MigrationPage() {
  const userRole = await getCurrentUserRole();
  
  // Only allow admin users
  if (!userRole || userRole !== 'admin') {
    redirect('/dashboard');
  }

  return <AdminMigrationPage />;
}