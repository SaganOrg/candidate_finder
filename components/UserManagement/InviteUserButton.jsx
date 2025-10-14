'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import InviteUserModal from './InviteUserModal';

export default function InviteUserButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <UserPlus size={20} />
        Invite User
      </button>

      <InviteUserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}