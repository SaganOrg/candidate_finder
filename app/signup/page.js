import { verifyInviteToken } from '@/lib/actions/users';
import SignupForm from '@/components/Auth/SignupForm';
import { redirect } from 'next/navigation';

export default async function SignupPage({ searchParams }) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h1>
          <p className="text-gray-600">
            No invitation token provided. Please use the link from your invitation email.
          </p>
        </div>
      </div>
    );
  }

  const result = await verifyInviteToken(token);

  if (!result.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{result.error}</p>
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <SignupForm token={token} email={result.data.email} role={result.data.role} />
    </div>
  );
}