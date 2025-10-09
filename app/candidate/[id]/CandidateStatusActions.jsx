'use client';

import { useState } from 'react';
import { Ban, CheckCircle } from 'lucide-react';

export default function CandidateStatusActions({ candidateId, isBlacklisted, candidateStatus }) {
  const [blacklisted, setBlacklisted] = useState(isBlacklisted);
  const [status, setStatus] = useState(candidateStatus);
  const [loading, setLoading] = useState(false);
  
  const isAvailable = status === 'Available';

  const handleToggleBlacklist = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/candidates/toggle-blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          isBlacklisted: !blacklisted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update blacklist status');
      }

      setBlacklisted(!blacklisted);
      
      // If blacklisting, also set as unavailable
      if (!blacklisted) {
        setStatus('Not Available');
      }

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error toggling blacklist:', error);
      alert(`Failed to update blacklist status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    setLoading(true);
    try {
      const newStatus = isAvailable ? 'Not Available' : 'Available';
      
      const response = await fetch('/api/candidates/toggle-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          candidateStatus: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update availability status');
      }

      setStatus(newStatus);

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert(`Failed to update availability status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleBlacklist}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
          blacklisted
            ? 'bg-red-100 text-red-800 hover:bg-red-200 border-2 border-red-400'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Ban size={16} />
        {blacklisted ? 'Blacklisted' : 'Blacklist'}
      </button>

      <button
        onClick={handleToggleAvailability}
        disabled={loading || blacklisted}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
          isAvailable
            ? 'bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-400'
            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-2 border-yellow-400'
        } ${loading || blacklisted ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CheckCircle size={16} />
        {status}
      </button>
    </div>
  );
}