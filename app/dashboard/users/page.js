import { getUsers, getCurrentUserRole } from '@/lib/actions/users';
import { redirect } from 'next/navigation';
import UserTable from '@/components/UserManagement/UserTable';
import InviteUserButton from '@/components/UserManagement/InviteUserButton';

export default async function UsersPage() {
  const role = await getCurrentUserRole();

  // Only admins can access this page
  if (role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: users, error } = await getUsers();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users and send invitations
          </p>
        </div>
        <InviteUserButton />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error loading users: {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">
          Total Users: <span className="font-semibold">{users.length}</span>
        </p>
      </div>

      <UserTable users={users} />
    </div>
  );
}