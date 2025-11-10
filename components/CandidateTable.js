'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Edit2, Trash2, Eye, Plus, ChevronLeft, ChevronRight, Ban, CheckCircle, UserCheck, UserX } from 'lucide-react';
import { deleteCandidate, toggleBlacklist, toggleAvailability } from '@/lib/actions/candidates';
import CandidateModal from './CandidateModal';
import Link from 'next/link';

export default function CandidateTable({ candidates, totalCount, currentPage, pageSize }) {
  console.log(candidates)
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  const handleView = (candidate) => {
    setSelectedCandidate(candidate);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEdit = (candidate) => {
    setSelectedCandidate(candidate);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedCandidate(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    
    startTransition(async () => {
      const result = await deleteCandidate(id);
      
      if (result.error) {
        alert('Error deleting candidate: ' + result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleBlacklist = async (id, currentStatus, candidateName) => {
    const action = currentStatus ? 'remove from blacklist' : 'blacklist';
    if (!confirm(`Are you sure you want to ${action} ${candidateName}?`)) return;
    
    startTransition(async () => {
      const result = await toggleBlacklist(id, currentStatus);
      
      if (result.error) {
        alert('Error updating blacklist status: ' + result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleAvailability = async (id, currentStatus, candidateName) => {
    const action = currentStatus === 'Available' ? 'mark as Not Available' : 'mark as Available';
    if (!confirm(`Are you sure you want to ${action} ${candidateName}?`)) return;
    
    startTransition(async () => {
      const result = await toggleAvailability(id, currentStatus);
      
      if (result.error) {
        alert('Error updating availability status: ' + result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <ul>
                  <li className='text-blue-400 text-sm'>Click on the ID will show the real resume of the candidate</li>
                </ul>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition"
          disabled={isPending}
        >
          <Plus size={18} />
          Add Candidate
        </button>
         
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isPending ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No candidates found. Try adjusting your filters or search term.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Desired Rate
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience Roles
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Work Style
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blacklist
                  </th>
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => {
                  // Parse metadata if it's a string
                  let metadata = candidate.metadata;
                  if (typeof metadata === 'string') {
                    try {
                      metadata = JSON.parse(metadata);
                    } catch (e) {
                      metadata = {};
                    }
                  }

                  return (
                  <tr key={candidate.id} className={`hover:bg-gray-50 transition ${candidate.blacklist ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-semibold text-blue-500 underline">
                       <Link href={`${candidate?.resume_link}`} target='_blank'> {candidate.id} </Link>
                       {/* {candidate.id} */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleView(candidate)}
                          className="text-blue-600 hover:text-blue-900 transition"
                          disabled={isPending}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(candidate)}
                          className="text-indigo-600 hover:text-indigo-900 transition"
                          disabled={isPending}
                          title="Edit Candidate"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(candidate.id)}
                          className="text-red-600 hover:text-red-900 transition"
                          disabled={isPending}
                          title="Delete Candidate"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {candidate.persons_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {candidate.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {candidate.candidate_job_title || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {metadata?.years_of_experience ? `${metadata.years_of_experience} years` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {candidate.country || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {candidate.desired_rate || 'N/A'}
                      </div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {candidate.industry || 'N/A'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {candidate.skills_technical || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {candidate.experience_role || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {candidate.work_style || 'N/A'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleAvailability(candidate.id, candidate.candidate_status, candidate.persons_name)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          candidate.candidate_status === 'Available'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        }`}
                      >
                        {candidate.candidate_status === 'Available' ? (
                          <>
                            <UserCheck size={14} />
                            Available
                          </>
                        ) : (
                          <>
                            <UserX size={14} />
                            Not Available
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleBlacklist(candidate.id, candidate.blacklist, candidate.persons_name)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          candidate.blacklist
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {candidate.blacklist ? (
                          <>
                            <Ban size={14} />
                            Blacklisted
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            Active
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleView(candidate)}
                          className="text-blue-600 hover:text-blue-900 transition"
                          disabled={isPending}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(candidate)}
                          className="text-indigo-600 hover:text-indigo-900 transition"
                          disabled={isPending}
                          title="Edit Candidate"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(candidate.id)}
                          className="text-red-600 hover:text-red-900 transition"
                          disabled={isPending}
                          title="Delete Candidate"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={18} />
            Previous
          </button>
          <span className="text-gray-600">
            Page <span className="font-semibold">{currentPage}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {showModal && (
        <CandidateModal
          mode={modalMode}
          candidate={selectedCandidate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}